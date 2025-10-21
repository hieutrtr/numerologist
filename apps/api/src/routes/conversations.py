"""
Conversation Routes - FastAPI endpoints for conversation management
Handles saving and retrieving voice-numerology conversations.
Story 1.2c: Daily.co voice streaming integration endpoints
"""

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel

from ..models.conversation import Conversation
from ..schemas.conversation import (
    ConversationCreateRequest,
    ConversationResponse,
    ConversationListResponse,
)
from ..dependencies import get_db
from ..services.conversation_service import ConversationService
from ..utils.redis_client import get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/v1/conversations', tags=['conversations'])


# Pydantic models for Daily.co endpoints
class DailyRoomResponse(BaseModel):
    """Response with Daily.co room URL and token"""
    conversation_id: str
    room_url: str
    token: str


class DailyTokenResponse(BaseModel):
    """Response with fresh Daily.co token"""
    token: str
    room_url: str


class MessageSaveRequest(BaseModel):
    """Request to save a message during conversation"""
    text: str
    confidence: Optional[float] = None
    emotional_tone: Optional[str] = None


class EndConversationRequest(BaseModel):
    """Request to end conversation"""
    rating: Optional[int] = None


@router.post('', response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: ConversationCreateRequest,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    Save a completed conversation
    
    Creates a new conversation record with all collected user data,
    calculated numerology numbers, and generated insight.
    
    Requires x-user-id header with the authenticated user's ID.
    """
    try:
        # Validate user_id is a valid UUID
        try:
            UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid user_id format',
            )

        # Create conversation object
        conversation = Conversation(
            user_id=UUID(user_id),
            user_name=request.user_name,
            birth_date=request.birth_date,
            user_question=request.user_question,
            numbers_calculated=request.numbers_calculated.dict(),
            insight_provided=request.insight_provided,
            satisfaction_feedback=request.satisfaction_feedback,
        )

        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

        return ConversationResponse.from_orm(conversation)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to save conversation',
        )


@router.get('/{conversation_id}', response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    Retrieve a specific conversation by ID
    
    Only users who own the conversation can retrieve it.
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid user_id format',
        )

    # Query for conversation
    stmt = select(Conversation).where(
        (Conversation.id == conversation_id) &
        (Conversation.user_id == user_uuid)
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Conversation not found',
        )

    return ConversationResponse.from_orm(conversation)


@router.get('', response_model=ConversationListResponse)
async def list_conversations(
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
) -> ConversationListResponse:
    """
    List user's conversations with pagination
    
    Returns all conversations for the current user, newest first.
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid user_id format',
        )

    # Count total conversations for user
    count_stmt = select(Conversation).where(Conversation.user_id == user_uuid)
    count_result = await db.execute(count_stmt)
    total = len(count_result.fetchall())

    # Query conversations with pagination
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == user_uuid)
        .order_by(Conversation.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    conversations = result.scalars().all()

    return ConversationListResponse(
        total=total,
        conversations=[ConversationResponse.from_orm(c) for c in conversations],
    )


@router.get('/user/recent', response_model=ConversationResponse)
async def get_recent_conversation(
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    Get user's most recent conversation

    Useful for displaying last insight or continuing conversation.
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid user_id format',
        )

    stmt = (
        select(Conversation)
        .where(Conversation.user_id == user_uuid)
        .order_by(Conversation.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='No conversations found',
        )

    return ConversationResponse.from_orm(conversation)


# === Daily.co Voice Streaming Endpoints (Story 1.2c) ===


@router.post('/daily/room', response_model=DailyRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_conversation(
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis_client),
) -> DailyRoomResponse:
    """
    Create a new conversation with Daily.co room and token.

    Story 1.2c Acceptance Criteria:
    - POST `/conversations` endpoint creates Daily.co room with proper configuration:
      - max_participants: 2 (user + bot)
      - record_on_start: true for auto-recording
      - lang: "vi" for Vietnamese UI
      - Returns room_url and meeting token with 1-hour expiry

    Args:
        user_id: User ID from x-user-id header
        db: Database session
        redis: Redis client for caching

    Returns:
        DailyRoomResponse with conversation_id, room_url, and token

    Raises:
        HTTPException: If Daily.co is not configured or room creation fails
    """
    try:
        service = ConversationService(db, redis)
        result = await service.create_conversation_with_daily(user_id)
        return DailyRoomResponse(**result)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Daily.co service not configured",
        )
    except Exception as e:
        logger.error(f"Failed to create Daily.co room: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation room",
        )


@router.post('/{conversation_id}/daily/token', response_model=DailyTokenResponse)
async def get_daily_token(
    conversation_id: str,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis_client),
) -> DailyTokenResponse:
    """
    Generate a fresh token for an existing Daily.co conversation.

    Story 1.2c Acceptance Criteria:
    - POST `/conversations/{id}/token` endpoint generates fresh tokens for existing conversations

    Args:
        conversation_id: ID of the conversation
        user_id: User ID from x-user-id header
        db: Database session
        redis: Redis client

    Returns:
        DailyTokenResponse with new token and room_url

    Raises:
        HTTPException: If conversation not found or token generation fails
    """
    try:
        service = ConversationService(db, redis)
        result = await service.get_daily_token(conversation_id, user_id)
        return DailyTokenResponse(**result)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to generate token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate meeting token",
        )


@router.post('/{conversation_id}/messages/user')
async def save_user_message(
    conversation_id: str,
    message: MessageSaveRequest,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis_client),
):
    """
    Save user-spoken message during conversation.

    Args:
        conversation_id: ID of the conversation
        message: Message data (text, confidence)
        user_id: User ID from x-user-id header
        db: Database session
        redis: Redis client

    Returns:
        Dict with message_id and metadata
    """
    try:
        service = ConversationService(db, redis)
        result = await service.save_user_message(
            conversation_id,
            message.text,
            message.confidence or 0.0,
        )
        await db.commit()
        return result
    except Exception as e:
        logger.error(f"Failed to save user message: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save message",
        )


@router.post('/{conversation_id}/messages/assistant')
async def save_assistant_message(
    conversation_id: str,
    message: MessageSaveRequest,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis_client),
):
    """
    Save assistant-generated message during conversation.

    Args:
        conversation_id: ID of the conversation
        message: Message data (text, emotional_tone)
        user_id: User ID from x-user-id header
        db: Database session
        redis: Redis client

    Returns:
        Dict with message_id and metadata
    """
    try:
        service = ConversationService(db, redis)
        result = await service.save_assistant_message(
            conversation_id,
            message.text,
            message.emotional_tone or "warm",
        )
        await db.commit()
        return result
    except Exception as e:
        logger.error(f"Failed to save assistant message: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save message",
        )


@router.patch('/{conversation_id}', response_model=ConversationResponse)
async def end_conversation(
    conversation_id: str,
    request: EndConversationRequest,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis_client),
) -> ConversationResponse:
    """
    End conversation and capture recording URL.

    Story 1.2c Acceptance Criteria:
    - PATCH `/conversations/{id}` endpoint ends conversation and captures recording URL
    - Proper cleanup of Daily.co rooms after conversation ends

    Args:
        conversation_id: ID of the conversation
        request: EndConversationRequest with optional rating
        user_id: User ID from x-user-id header
        db: Database session
        redis: Redis client

    Returns:
        ConversationResponse with updated conversation data

    Raises:
        HTTPException: If conversation not found or cleanup fails
    """
    try:
        service = ConversationService(db, redis)
        result = await service.end_conversation(
            conversation_id,
            user_id,
            request.rating,
        )
        return result
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to end conversation: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end conversation",
        )


@router.get('/{conversation_id}/history')
async def get_conversation_history(
    conversation_id: str,
    user_id: str = Header(..., alias='x-user-id'),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis_client),
):
    """
    Retrieve conversation history and message transcript.

    Args:
        conversation_id: ID of the conversation
        user_id: User ID from x-user-id header
        db: Database session
        redis: Redis client

    Returns:
        Dict with conversation data and message history
    """
    try:
        service = ConversationService(db, redis)
        result = await service.get_conversation_history(conversation_id, user_id)
        return result
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to retrieve history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation history",
        )
