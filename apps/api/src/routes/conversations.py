"""
Conversation Routes - FastAPI endpoints for conversation management
Handles saving and retrieving voice-numerology conversations
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import APIRouter, Depends, HTTPException, status

from ..models.conversation import Conversation
from ..models.user import User
from ..schemas.conversation import (
    ConversationCreateRequest,
    ConversationResponse,
    ConversationListResponse,
)
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix='/conversations', tags=['conversations'])


@router.post('', response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: ConversationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    Save a completed conversation
    
    Creates a new conversation record with all collected user data,
    calculated numerology numbers, and generated insight.
    """
    try:
        # Create conversation object
        conversation = Conversation(
            user_id=current_user.id,
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

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to save conversation',
        )


@router.get('/{conversation_id}', response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    Retrieve a specific conversation by ID
    
    Only users who own the conversation can retrieve it.
    """
    # Query for conversation
    stmt = select(Conversation).where(
        (Conversation.id == conversation_id) &
        (Conversation.user_id == current_user.id)
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
) -> ConversationListResponse:
    """
    List user's conversations with pagination
    
    Returns all conversations for the current user, newest first.
    """
    # Count total conversations for user
    count_stmt = select(Conversation).where(Conversation.user_id == current_user.id)
    count_result = await db.execute(count_stmt)
    total = len(count_result.fetchall())

    # Query conversations with pagination
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """
    Get user's most recent conversation
    
    Useful for displaying last insight or continuing conversation.
    """
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
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
