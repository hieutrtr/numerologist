"""
Unit tests for ConversationService - Daily.co integration (Story 1.2c)
Tests for room creation, token generation, message persistence, and cleanup
"""

import pytest
import asyncio
import json
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.conversation_service import ConversationService, DailyClientWrapper
from ..models.conversation import Conversation


class MockDaily:
    """Mock Daily client for testing"""
    def __init__(self, raise_error=False):
        self.raise_error = raise_error

    def create_room(self, config):
        if self.raise_error:
            raise RuntimeError("Failed to create room")
        return {
            "url": "https://daily.co/test_room_123",
            "name": "test_room_123",
            "api_created": True,
        }

    def create_meeting_token(self, room_url, config):
        if self.raise_error:
            raise RuntimeError("Failed to create token")
        return {"token": "test_token_12345"}

    def get_room(self, room_url):
        return {
            "url": room_url,
            "name": "test_room_123",
            "status": "live",
        }

    def delete_room(self, room_url):
        if self.raise_error:
            raise RuntimeError("Failed to delete room")
        return {"success": True}


@pytest.fixture
def mock_daily_client():
    """Fixture for mock Daily client"""
    return MockDaily()


@pytest.fixture
def mock_redis():
    """Fixture for mock Redis client"""
    mock = AsyncMock()
    mock.setex = AsyncMock(return_value=True)
    mock.get = AsyncMock(return_value=None)
    mock.delete = AsyncMock(return_value=1)
    return mock


@pytest.fixture
async def conversation_service(db_session: AsyncSession, mock_redis):
    """Fixture for ConversationService instance"""
    with patch('src.services.conversation_service.settings') as mock_settings:
        mock_settings.daily_api_key = "test_api_key"
        with patch('src.services.conversation_service.DailyClientWrapper'):
            service = ConversationService(db_session, mock_redis)
            # Mock the daily_client
            service.daily_client = AsyncMock()
            service.daily_client.create_room = AsyncMock(
                return_value={
                    "url": "https://daily.co/test_room_123",
                    "name": "test_room_123",
                }
            )
            service.daily_client.create_meeting_token = AsyncMock(
                return_value="test_token_12345"
            )
            service.daily_client.delete_room = AsyncMock(return_value=None)
            return service


class TestDailyClientWrapper:
    """Tests for DailyClientWrapper"""

    def test_wrapper_initialization(self):
        """Test DailyClientWrapper initialization"""
        with patch('src.services.conversation_service.Daily', return_value=MockDaily()):
            wrapper = DailyClientWrapper("test_key")
            assert wrapper.client is not None

    def test_wrapper_initialization_without_package(self):
        """Test DailyClientWrapper raises error if daily-client not installed"""
        with patch('src.services.conversation_service.Daily', side_effect=ImportError):
            with pytest.raises(ImportError):
                DailyClientWrapper("test_key")

    @pytest.mark.asyncio
    async def test_create_room_async(self):
        """Test create_room wraps sync call to thread"""
        with patch('src.services.conversation_service.Daily', return_value=MockDaily()):
            wrapper = DailyClientWrapper("test_key")
            room = await wrapper.create_room({"properties": {"max_participants": 2}})
            assert room["url"] == "https://daily.co/test_room_123"

    @pytest.mark.asyncio
    async def test_create_meeting_token_async(self):
        """Test create_meeting_token wraps sync call to thread"""
        with patch('src.services.conversation_service.Daily', return_value=MockDaily()):
            wrapper = DailyClientWrapper("test_key")
            token = await wrapper.create_meeting_token(
                "https://daily.co/test_room_123",
                expires_in_seconds=3600
            )
            assert token == "test_token_12345"


class TestConversationService:
    """Tests for ConversationService"""

    @pytest.mark.asyncio
    async def test_create_conversation_with_daily(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test create_conversation_with_daily creates room, token, and DB record"""
        user_id = str(uuid4())

        # Execute
        result = await conversation_service.create_conversation_with_daily(user_id)

        # Verify
        assert result["conversation_id"] is not None
        assert result["room_url"] == "https://daily.co/test_room_123"
        assert result["token"] == "test_token_12345"

        # Verify room was created
        conversation_service.daily_client.create_room.assert_called_once()

        # Verify token was created
        conversation_service.daily_client.create_meeting_token.assert_called_once()

        # Verify conversation was saved to database
        stmt = select(Conversation).where(Conversation.id == result["conversation_id"])
        result_db = await db_session.execute(stmt)
        conversation = result_db.scalar_one_or_none()
        assert conversation is not None
        assert str(conversation.user_id) == user_id

    @pytest.mark.asyncio
    async def test_create_conversation_with_daily_invalid_user_id(
        self, conversation_service: ConversationService
    ):
        """Test create_conversation_with_daily with invalid user_id raises error"""
        with pytest.raises(ValueError, match="Invalid user_id format"):
            await conversation_service.create_conversation_with_daily("invalid_id")

    @pytest.mark.asyncio
    async def test_create_conversation_rollback_on_token_failure(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test create_conversation_with_daily rolls back room if token fails"""
        user_id = str(uuid4())

        # Setup: make token generation fail
        conversation_service.daily_client.create_meeting_token.side_effect = RuntimeError(
            "Token generation failed"
        )

        # Execute & verify exception
        with pytest.raises(RuntimeError):
            await conversation_service.create_conversation_with_daily(user_id)

        # Verify room was deleted on failure
        conversation_service.daily_client.delete_room.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_daily_token(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test get_daily_token generates fresh token for existing conversation"""
        # Setup: create a conversation first
        user_id = str(uuid4())
        conversation = Conversation(
            user_id=user_id,
            user_name="Test User",
            birth_date="1990-01-01",
            numbers_calculated={},
            insight_provided="Test insight",
        )
        db_session.add(conversation)
        await db_session.flush()

        # Mock Redis to return cached room info
        conversation_service.redis.get = AsyncMock(
            return_value=json.dumps({
                "room_url": "https://daily.co/test_room_123",
                "user_id": user_id,
            })
        )

        # Execute
        result = await conversation_service.get_daily_token(
            str(conversation.id), user_id
        )

        # Verify
        assert result["token"] == "test_token_12345"
        assert result["room_url"] == "https://daily.co/test_room_123"
        conversation_service.daily_client.create_meeting_token.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_daily_token_conversation_not_found(
        self, conversation_service: ConversationService
    ):
        """Test get_daily_token with non-existent conversation raises error"""
        user_id = str(uuid4())
        conversation_id = str(uuid4())

        with pytest.raises(ValueError, match="Conversation not found"):
            await conversation_service.get_daily_token(conversation_id, user_id)

    @pytest.mark.asyncio
    async def test_save_user_message(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test save_user_message persists user message with confidence"""
        # Setup: create a conversation
        conversation = Conversation(
            user_id=uuid4(),
            user_name="Test User",
            birth_date="1990-01-01",
            numbers_calculated={},
            insight_provided="",
        )
        db_session.add(conversation)
        await db_session.flush()

        # Execute
        result = await conversation_service.save_user_message(
            str(conversation.id),
            text="What is my future?",
            confidence=0.95,
        )

        # Verify
        assert result["type"] == "user"
        assert result["conversation_id"] == str(conversation.id)
        assert result["confidence"] == 0.95

        # Verify message was added to conversation
        await db_session.refresh(conversation)
        messages = conversation.numbers_calculated.get("messages", [])
        assert len(messages) > 0
        assert messages[0]["type"] == "user"
        assert messages[0]["text"] == "What is my future?"

    @pytest.mark.asyncio
    async def test_save_assistant_message(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test save_assistant_message persists assistant message"""
        # Setup
        conversation = Conversation(
            user_id=uuid4(),
            user_name="Test User",
            birth_date="1990-01-01",
            numbers_calculated={},
            insight_provided="",
        )
        db_session.add(conversation)
        await db_session.flush()

        # Execute
        result = await conversation_service.save_assistant_message(
            str(conversation.id),
            text="Your life path number is 7",
            emotional_tone="warm",
        )

        # Verify
        assert result["type"] == "assistant"
        assert result["emotional_tone"] == "warm"

        # Verify message was added
        await db_session.refresh(conversation)
        messages = conversation.numbers_calculated.get("messages", [])
        assert len(messages) > 0
        assert messages[0]["text"] == "Your life path number is 7"

    @pytest.mark.asyncio
    async def test_concurrent_message_saves(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test concurrent message saves don't create race conditions"""
        # Setup
        conversation = Conversation(
            user_id=uuid4(),
            user_name="Test User",
            birth_date="1990-01-01",
            numbers_calculated={},
            insight_provided="",
        )
        db_session.add(conversation)
        await db_session.flush()

        # Execute: save 5 messages concurrently
        conversation_id = str(conversation.id)
        tasks = [
            conversation_service.save_user_message(
                conversation_id,
                f"Message {i}",
                confidence=0.9
            )
            for i in range(5)
        ]
        results = await asyncio.gather(*tasks)

        # Verify all saves succeeded
        assert len(results) == 5
        for i, result in enumerate(results):
            assert result["type"] == "user"

        # Verify all messages in database
        await db_session.refresh(conversation)
        messages = conversation.numbers_calculated.get("messages", [])
        assert len(messages) == 5

    @pytest.mark.asyncio
    async def test_end_conversation(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test end_conversation cleans up room and updates conversation"""
        # Setup
        user_id = str(uuid4())
        conversation = Conversation(
            user_id=user_id,
            user_name="Test User",
            birth_date="1990-01-01",
            numbers_calculated={},
            insight_provided="Test insight",
        )
        db_session.add(conversation)
        await db_session.flush()

        # Mock Redis to return room URL
        conversation_service.redis.get = AsyncMock(
            return_value=json.dumps({
                "room_url": "https://daily.co/test_room_123",
                "user_id": user_id,
            })
        )

        # Execute
        result = await conversation_service.end_conversation(
            str(conversation.id),
            user_id,
            rating=5,
        )

        # Verify
        assert result.id == conversation.id
        assert result.satisfaction_feedback == "5"

        # Verify room was deleted
        conversation_service.daily_client.delete_room.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_conversation_history(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test get_conversation_history retrieves all messages"""
        # Setup
        user_id = str(uuid4())
        conversation = Conversation(
            user_id=user_id,
            user_name="Test User",
            birth_date="1990-01-01",
            numbers_calculated={
                "messages": [
                    {
                        "type": "user",
                        "text": "Hello",
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    {
                        "type": "assistant",
                        "text": "Hi there",
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                ]
            },
            insight_provided="Test insight",
        )
        db_session.add(conversation)
        await db_session.commit()

        # Execute
        result = await conversation_service.get_conversation_history(
            str(conversation.id), user_id
        )

        # Verify
        assert result["id"] == str(conversation.id)
        assert len(result["messages"]) == 2
        assert result["messages"][0]["type"] == "user"
        assert result["messages"][1]["type"] == "assistant"

    @pytest.mark.asyncio
    async def test_list_conversations(
        self, conversation_service: ConversationService, db_session: AsyncSession
    ):
        """Test list_conversations returns paginated user conversations"""
        # Setup
        user_id = uuid4()
        for i in range(3):
            conversation = Conversation(
                user_id=user_id,
                user_name=f"User {i}",
                birth_date="1990-01-01",
                numbers_calculated={},
                insight_provided=f"Insight {i}",
            )
            db_session.add(conversation)
        await db_session.commit()

        # Execute
        result = await conversation_service.list_conversations(
            str(user_id), limit=2, offset=0
        )

        # Verify
        assert result["total"] == 3
        assert len(result["conversations"]) == 2
        assert result["limit"] == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
