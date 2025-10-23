"""
Conversation Service - Daily.co voice streaming integration and message management
Handles creation of voice rooms, token generation, message persistence, and recording capture.
Story 1.2c: Daily-React Voice Streaming for Numeroly
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID

import httpx
import redis.asyncio
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models.conversation import Conversation
from ..schemas.conversation import ConversationResponse
from .voice_service import AzureOpenAISpeechToTextService
from .pipecat_bot_service import PipecatBotService

logger = logging.getLogger(__name__)


class DailyClientWrapper:
    """
    Wraps the Daily.co REST API to create and manage rooms.
    Uses httpx for async HTTP requests to the Daily.co REST API.
    """

    def __init__(self, api_key: str):
        """
        Initialize Daily.co REST API client wrapper.

        Args:
            api_key: Daily.co API key from environment
        """
        self.api_key = api_key
        self.base_url = "https://api.daily.co/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def create_room(self, room_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a Daily.co room via REST API.

        Args:
            room_config: Room configuration dict with properties

        Returns:
            Room object with url, room_name, etc.

        Raises:
            Exception: If room creation fails
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/rooms",
                headers=self.headers,
                json=room_config,
            )
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_detail = response.json()
                except:
                    pass
                logger.error(f"Daily.co API error {response.status_code}: {error_detail}")
            response.raise_for_status()
            return response.json()

    async def create_meeting_token(
        self, room_url: str, expires_in_seconds: int = 3600
    ) -> str:
        """
        Generate a meeting token for a room via REST API.

        Args:
            room_url: URL of the Daily.co room
            expires_in_seconds: Token expiration time (default 1 hour)

        Returns:
            Meeting token string

        Raises:
            Exception: If token generation fails
        """
        # Extract room name from URL (e.g., "https://example.daily.co" -> "example")
        room_name = room_url.split("/")[-1] if "/" in room_url else room_url

        # Create token with room_name in properties
        # Note: The Daily.co API wraps room_name and other config in properties
        token_payload = {
            "properties": {
                "room_name": room_name,
            }
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/meeting-tokens",
                headers=self.headers,
                json=token_payload,
            )
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_detail = response.json()
                except:
                    pass
                logger.error(f"Daily.co API error {response.status_code}: {error_detail}")
            response.raise_for_status()
            data = response.json()
            return data.get("token")

    async def get_room(self, room_url: str) -> Dict[str, Any]:
        """
        Get room information via REST API.

        Args:
            room_url: URL of the Daily.co room

        Returns:
            Room object with current status
        """
        # Extract room name from URL
        room_name = room_url.split("/")[-1] if "/" in room_url else room_url

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rooms/{room_name}",
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def delete_room(self, room_url: str) -> None:
        """
        Delete a Daily.co room via REST API.

        Args:
            room_url: URL of the Daily.co room to delete
        """
        # Extract room name from URL
        room_name = room_url.split("/")[-1] if "/" in room_url else room_url

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/rooms/{room_name}",
                headers=self.headers,
            )
            response.raise_for_status()


class ConversationService:
    """
    Service for managing voice conversations via Daily.co.
    Handles room creation, token generation, message persistence, and recording capture.
    """

    def __init__(self, db: AsyncSession, redis_client: Optional[redis.asyncio.Redis] = None):
        """
        Initialize conversation service.

        Args:
            db: SQLAlchemy async session for database operations
            redis_client: Redis async client for session caching (optional)
        """
        self.db = db
        self.redis = redis_client
        self.daily_client: Optional[DailyClientWrapper] = None
        self.message_semaphores: Dict[str, asyncio.Semaphore] = {}
        self.voice_service = AzureOpenAISpeechToTextService()

        # Initialize Daily.co client if API key is configured
        if settings.daily_api_key:
            self.daily_client = DailyClientWrapper(settings.daily_api_key)
        else:
            logger.warning(
                "DAILY_API_KEY not configured. Daily.co voice streaming will not work."
            )

    async def _get_semaphore(self, conversation_id: str) -> asyncio.Semaphore:
        """
        Get or create a semaphore for a conversation to prevent race conditions
        in concurrent message saves.

        Args:
            conversation_id: ID of the conversation

        Returns:
            Asyncio semaphore for exclusive access to conversation state
        """
        if conversation_id not in self.message_semaphores:
            self.message_semaphores[conversation_id] = asyncio.Semaphore(1)
        return self.message_semaphores[conversation_id]

    async def create_conversation_with_daily(self, user_id: str) -> Dict[str, Any]:
        """
        Create a new conversation with Daily.co room setup.
        Handles room creation, token generation, and database persistence atomically.

        Implementation of Story 1.2c acceptance criteria:
        - POST `/conversations` endpoint creates Daily.co room
        - max_participants: 2 (user + bot)
        - record_on_start: true for auto-recording
        - lang: "vi" for Vietnamese UI
        - Returns room_url and meeting token with 1-hour expiry

        Args:
            user_id: UUID of authenticated user

        Returns:
            Dict with conversation_id, room_url, and token

        Raises:
            ValueError: If user_id is invalid
            Exception: If room creation or token generation fails
        """
        if not self.daily_client:
            raise RuntimeError("Daily.co not configured. Set DAILY_API_KEY in .env")

        room = None
        try:
            # Validate user_id
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                raise ValueError(f"Invalid user_id format: {user_id}")

            # Step 1: Create Daily.co room
            # Note: max_participants, recording, and language can be configured after room creation
            # For now, create a basic room and configure properties later if needed
            room_config = {}

            logger.info(f"Creating Daily.co room for user {user_id}")
            room = await self.daily_client.create_room(room_config)
            room_url = room.get("url")
            logger.info(f"Daily.co room created: {room_url}")

            # Step 2: Generate meeting token with 1-hour expiry
            logger.info(f"Generating user token for room {room_url}")
            token = await self.daily_client.create_meeting_token(
                room_url, expires_in_seconds=3600
            )
            logger.info("User meeting token generated successfully")

            # Step 2.5: Generate bot token (separate participant)
            logger.info(f"Generating bot token for room {room_url}")
            bot_token = await self.daily_client.create_meeting_token(
                room_url,
                expires_in_seconds=3600
            )
            logger.info("Bot token generated successfully")

            # Step 3: Save conversation to database
            conversation = Conversation(
                user_id=user_uuid,
                user_name="",  # Will be populated during conversation
                birth_date="",  # Will be populated during conversation
                numbers_calculated={},
                insight_provided="",
            )

            self.db.add(conversation)
            await self.db.flush()  # Flush to get the ID without committing

            # Step 4: Cache room info in Redis for quick access
            if self.redis:
                conversation_key = f"conversation:{conversation.id}:daily"
                cache_data = {
                    "room_url": room_url,
                    "user_id": str(user_uuid),
                    "created_at": datetime.utcnow().isoformat(),
                    "status": "active",
                }
                await self.redis.setex(
                    conversation_key,
                    86400,  # 24-hour TTL
                    json.dumps(cache_data),
                )
                logger.info(f"Cached conversation data in Redis for {conversation.id}")

            await self.db.commit()
            await self.db.refresh(conversation)

            logger.info(f"========================================")
            logger.info(f"DATABASE COMMITTED - Conversation ID: {conversation.id}")
            logger.info(f"Room URL: {room_url}")
            logger.info(f"Bot token exists: {bot_token is not None}")
            logger.info(f"========================================")

            # Step 5: Start Pipecat bot pipeline (Story 1.2d)
            # Bot will join room as separate participant and handle voice conversation
            try:
                logger.info(f"****************************************")
                logger.info(f"ATTEMPTING TO START BOT PIPELINE for conversation {conversation.id}")
                logger.info(f"****************************************")

                bot_service = PipecatBotService()
                logger.info("Bot service instance created")

                await bot_service.create_pipeline(
                    room_url=room_url,
                    conversation_id=str(conversation.id),
                    token=bot_token,
                    user_id=user_id
                )

                logger.info(f"++++++++++++++++++++++++++++++++++++++++")
                logger.info(f"BOT PIPELINE STARTED SUCCESSFULLY for conversation {conversation.id}")
                logger.info(f"++++++++++++++++++++++++++++++++++++++++")

                logger.info(f"Bot pipeline started successfully for conversation {conversation.id}")
            except Exception as bot_error:
                # Log error but don't fail the conversation creation
                # User can still join room, just no bot assistance
                logger.error(
                    f"Failed to start bot pipeline for conversation {conversation.id}: {bot_error}",
                    exc_info=True
                )
                # Consider adding a status flag to indicate bot unavailable

            return {
                "conversation_id": str(conversation.id),
                "room_url": room_url,
                "token": token,
            }

        except Exception as e:
            # Rollback: Delete room if created but token/DB failed
            if room:
                try:
                    logger.warning(f"Rolling back room creation due to error: {str(e)}")
                    await self.daily_client.delete_room(room["url"])
                except Exception as cleanup_error:
                    logger.error(f"Failed to cleanup room: {str(cleanup_error)}")

            await self.db.rollback()
            logger.error(f"Failed to create conversation: {str(e)}")
            raise

    async def get_daily_token(
        self, conversation_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Generate a fresh token for an existing conversation.
        Implementation of Story 1.2c:
        - POST `/conversations/{id}/token` endpoint generates fresh tokens

        Args:
            conversation_id: ID of conversation
            user_id: ID of user (for authorization check)

        Returns:
            Dict with new token and room URL

        Raises:
            ValueError: If conversation not found or user unauthorized
            Exception: If token generation fails
        """
        if not self.daily_client:
            raise RuntimeError("Daily.co not configured. Set DAILY_API_KEY in .env")

        try:
            user_uuid = UUID(user_id)
            conv_uuid = UUID(conversation_id)
        except ValueError as e:
            raise ValueError(f"Invalid UUID format: {str(e)}")

        # Retrieve conversation from database
        stmt = select(Conversation).where(
            (Conversation.id == conv_uuid) & (Conversation.user_id == user_uuid)
        )
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation not found or user unauthorized")

        # Retrieve room URL from cache or reconstruct
        room_url = None
        if self.redis:
            conversation_key = f"conversation:{conversation_id}:daily"
            cached_data = await self.redis.get(conversation_key)
            if cached_data:
                room_info = json.loads(cached_data)
                room_url = room_info.get("room_url")

        if not room_url:
            # If not in cache, we need to reconstruct or store it
            # For now, we'll raise an error - room_url should be cached
            raise ValueError("Room URL not found in cache. Conversation may have expired.")

        # Generate new token
        logger.info(f"Generating new token for conversation {conversation_id}")
        token = await self.daily_client.create_meeting_token(room_url, expires_in_seconds=3600)

        return {
            "token": token,
            "room_url": room_url,
        }

    async def save_user_message(
        self, conversation_id: str, text: str, confidence: float
    ) -> Dict[str, Any]:
        """
        Save user-spoken message with confidence score.
        Implements concurrent message save safety via semaphore.

        Args:
            conversation_id: ID of conversation
            text: Transcribed user text
            confidence: STT confidence score (0.0-1.0)

        Returns:
            Dict with message_id and metadata
        """
        semaphore = await self._get_semaphore(conversation_id)

        async with semaphore:
            try:
                # Get conversation
                conv_uuid = UUID(conversation_id)
                stmt = select(Conversation).where(Conversation.id == conv_uuid)
                result = await self.db.execute(stmt)
                conversation = result.scalar_one_or_none()

                if not conversation:
                    raise ValueError(f"Conversation {conversation_id} not found")

                # Update conversation metadata with user message
                if not conversation.numbers_calculated:
                    conversation.numbers_calculated = {}

                # Store message in conversation context (for now in numbers_calculated JSON)
                if "messages" not in conversation.numbers_calculated:
                    conversation.numbers_calculated["messages"] = []

                message_record = {
                    "type": "user",
                    "text": text,
                    "confidence": confidence,
                    "timestamp": datetime.utcnow().isoformat(),
                }

                conversation.numbers_calculated["messages"].append(message_record)
                conversation.updated_at = datetime.utcnow()

                self.db.add(conversation)
                await self.db.flush()

                # Cache message in Redis
                if self.redis:
                    msg_key = f"conversation:{conversation_id}:messages:user:{message_record['timestamp']}"
                    await self.redis.setex(
                        msg_key,
                        86400,  # 24-hour TTL
                        json.dumps(message_record),
                    )

                logger.info(
                    f"Saved user message for {conversation_id}: confidence={confidence}"
                )

                return {
                    "message_id": message_record["timestamp"],
                    "conversation_id": conversation_id,
                    "type": "user",
                    "confidence": confidence,
                }

            except Exception as e:
                await self.db.rollback()
                logger.error(f"Failed to save user message: {str(e)}")
                raise

    async def save_assistant_message(
        self, conversation_id: str, text: str, emotional_tone: str = "warm"
    ) -> Dict[str, Any]:
        """
        Save assistant-generated message with emotional tone.

        Args:
            conversation_id: ID of conversation
            text: Assistant response text
            emotional_tone: Emotional tone ('warm', 'neutral', 'energetic')

        Returns:
            Dict with message_id and metadata
        """
        semaphore = await self._get_semaphore(conversation_id)

        async with semaphore:
            try:
                conv_uuid = UUID(conversation_id)
                stmt = select(Conversation).where(Conversation.id == conv_uuid)
                result = await self.db.execute(stmt)
                conversation = result.scalar_one_or_none()

                if not conversation:
                    raise ValueError(f"Conversation {conversation_id} not found")

                # Initialize messages if needed
                if not conversation.numbers_calculated:
                    conversation.numbers_calculated = {}
                if "messages" not in conversation.numbers_calculated:
                    conversation.numbers_calculated["messages"] = []

                message_record = {
                    "type": "assistant",
                    "text": text,
                    "emotional_tone": emotional_tone,
                    "timestamp": datetime.utcnow().isoformat(),
                }

                conversation.numbers_calculated["messages"].append(message_record)
                conversation.insight_provided = text  # Update insight
                conversation.updated_at = datetime.utcnow()

                self.db.add(conversation)
                await self.db.flush()

                # Cache message
                if self.redis:
                    msg_key = f"conversation:{conversation_id}:messages:assistant:{message_record['timestamp']}"
                    await self.redis.setex(
                        msg_key,
                        86400,  # 24-hour TTL
                        json.dumps(message_record),
                    )

                logger.info(
                    f"Saved assistant message for {conversation_id}: tone={emotional_tone}"
                )

                return {
                    "message_id": message_record["timestamp"],
                    "conversation_id": conversation_id,
                    "type": "assistant",
                    "emotional_tone": emotional_tone,
                }

            except Exception as e:
                await self.db.rollback()
                logger.error(f"Failed to save assistant message: {str(e)}")
                raise

    async def end_conversation(
        self, conversation_id: str, user_id: str, rating: Optional[int] = None
    ) -> ConversationResponse:
        """
        End conversation and capture recording URL.
        Implementation of Story 1.2c:
        - PATCH `/conversations/{id}` endpoint ends conversation
        - Ends conversation and captures recording URL
        - Proper cleanup of Daily.co rooms after conversation ends

        Args:
            conversation_id: ID of conversation
            user_id: ID of user (for authorization)
            rating: Optional satisfaction rating (1-5)

        Returns:
            Updated conversation response

        Raises:
            ValueError: If conversation not found
            Exception: If cleanup fails
        """
        try:
            user_uuid = UUID(user_id)
            conv_uuid = UUID(conversation_id)
        except ValueError as e:
            raise ValueError(f"Invalid UUID format: {str(e)}")

        try:
            # Get conversation
            stmt = select(Conversation).where(
                (Conversation.id == conv_uuid) & (Conversation.user_id == user_uuid)
            )
            result = await self.db.execute(stmt)
            conversation = result.scalar_one_or_none()

            if not conversation:
                raise ValueError("Conversation not found or user unauthorized")

            # Update satisfaction feedback
            if rating is not None:
                conversation.satisfaction_feedback = str(rating)

            # Retrieve room URL from cache
            room_url = None
            if self.redis:
                conversation_key = f"conversation:{conversation_id}:daily"
                cached_data = await self.redis.get(conversation_key)
                if cached_data:
                    room_info = json.loads(cached_data)
                    room_url = room_info.get("room_url")

            # Stop bot pipeline first (Story 1.2d)
            # Bot will leave room gracefully before room is deleted
            try:
                logger.info(f"Stopping bot pipeline for conversation {conversation_id}")
                bot_service = PipecatBotService()
                await bot_service.destroy_pipeline(conversation_id)
                logger.info(f"Bot pipeline stopped successfully")
            except ValueError:
                # Pipeline not found - already stopped or never started
                logger.info(f"Bot pipeline not found for conversation {conversation_id}")
            except Exception as bot_error:
                # Log error but continue with room deletion
                logger.error(
                    f"Failed to stop bot pipeline for conversation {conversation_id}: {bot_error}",
                    exc_info=True
                )

            # Delete Daily.co room (triggers recording finalization)
            if room_url and self.daily_client:
                try:
                    logger.info(f"Ending Daily.co room: {room_url}")
                    await self.daily_client.delete_room(room_url)
                    logger.info(f"Room deleted successfully")
                except Exception as e:
                    logger.error(f"Failed to delete Daily.co room: {str(e)}")
                    # Don't fail the entire operation if room deletion fails

            # Mark conversation as completed
            conversation.updated_at = datetime.utcnow()
            self.db.add(conversation)
            await self.db.commit()
            await self.db.refresh(conversation)

            # Clean up Redis cache
            if self.redis:
                conversation_key = f"conversation:{conversation_id}:daily"
                await self.redis.delete(conversation_key)

            logger.info(f"Conversation ended: {conversation_id}")

            return ConversationResponse.from_orm(conversation)

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to end conversation: {str(e)}")
            raise

    async def get_conversation_history(
        self, conversation_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Retrieve conversation history and recording metadata.

        Args:
            conversation_id: ID of conversation
            user_id: ID of user (for authorization)

        Returns:
            Dict with conversation data and message history
        """
        try:
            user_uuid = UUID(user_id)
            conv_uuid = UUID(conversation_id)
        except ValueError as e:
            raise ValueError(f"Invalid UUID format: {str(e)}")

        stmt = select(Conversation).where(
            (Conversation.id == conv_uuid) & (Conversation.user_id == user_uuid)
        )
        result = await self.db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError("Conversation not found or user unauthorized")

        # Extract messages from conversation data
        messages = conversation.numbers_calculated.get("messages", [])

        return {
            "id": str(conversation.id),
            "user_id": str(conversation.user_id),
            "messages": messages,
            "insight": conversation.insight_provided,
            "satisfaction_rating": conversation.satisfaction_feedback,
            "created_at": conversation.created_at.isoformat(),
            "ended_at": conversation.updated_at.isoformat(),
        }

    async def list_conversations(
        self, user_id: str, limit: int = 10, offset: int = 0
    ) -> Dict[str, Any]:
        """
        List user's conversations with pagination.

        Args:
            user_id: ID of user
            limit: Maximum number of conversations to return
            offset: Number of conversations to skip

        Returns:
            Dict with total count and list of conversations
        """
        try:
            user_uuid = UUID(user_id)
        except ValueError as e:
            raise ValueError(f"Invalid UUID format: {str(e)}")

        # Get total count
        count_stmt = select(Conversation).where(Conversation.user_id == user_uuid)
        count_result = await self.db.execute(count_stmt)
        total = len(count_result.fetchall())

        # Get paginated conversations
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_uuid)
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        conversations = result.scalars().all()

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "conversations": [ConversationResponse.from_orm(c) for c in conversations],
        }
