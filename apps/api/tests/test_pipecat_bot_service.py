"""
Unit tests for PipecatBotService

Story 1.2d: Daily.co Bot Participant with Pipecat Framework
"""

import pytest
from apps.api.src.services.pipecat_bot_service import PipecatBotService


@pytest.mark.asyncio
async def test_singleton_pattern():
    """Test that PipecatBotService implements singleton pattern correctly."""
    service1 = PipecatBotService()
    service2 = PipecatBotService()

    assert service1 is service2, "PipecatBotService should return same instance"


@pytest.mark.asyncio
async def test_get_pipeline_status_not_found():
    """Test get_pipeline_status returns not_found for non-existent pipeline."""
    service = PipecatBotService()

    status = service.get_pipeline_status("non-existent-conversation")

    assert status["status"] == "not_found"


@pytest.mark.asyncio
async def test_destroy_pipeline_not_found():
    """Test destroy_pipeline raises ValueError for non-existent pipeline."""
    service = PipecatBotService()

    with pytest.raises(ValueError, match="No pipeline found"):
        await service.destroy_pipeline("non-existent-conversation")


@pytest.mark.asyncio
async def test_create_pipeline_duplicate():
    """Test create_pipeline raises ValueError for duplicate conversation_id."""
    service = PipecatBotService()

    # Create first pipeline (will be basic since components not implemented yet)
    await service.create_pipeline(
        room_url="https://test.daily.co/test-room",
        conversation_id="test-conv-123",
        token="test-token",
        user_id="user-123",
    )

    # Try to create duplicate
    with pytest.raises(ValueError, match="Pipeline already exists"):
        await service.create_pipeline(
            room_url="https://test.daily.co/test-room",
            conversation_id="test-conv-123",  # Same conversation_id
            token="test-token",
            user_id="user-123",
        )

    # Cleanup
    await service.destroy_pipeline("test-conv-123")


@pytest.mark.asyncio
async def test_create_and_destroy_pipeline():
    """Test basic pipeline creation and destruction."""
    service = PipecatBotService()

    # Create pipeline
    task = await service.create_pipeline(
        room_url="https://test.daily.co/test-room",
        conversation_id="test-conv-456",
        token="test-token",
        user_id="user-456",
    )

    assert task is not None

    # Check status shows running
    status = service.get_pipeline_status("test-conv-456")
    assert status["status"] in ["running", "stopped"]  # May be stopped if queue_frames completes immediately
    assert status["conversation_id"] == "test-conv-456"

    # Destroy pipeline
    await service.destroy_pipeline("test-conv-456")

    # Check status shows not_found after destruction
    status = service.get_pipeline_status("test-conv-456")
    assert status["status"] == "not_found"


@pytest.mark.asyncio
async def test_destroy_all_pipelines():
    """Test destroy_all_pipelines cleans up multiple pipelines."""
    service = PipecatBotService()

    # Create multiple pipelines
    await service.create_pipeline(
        room_url="https://test.daily.co/room1",
        conversation_id="conv-1",
        token="token-1",
        user_id="user-1",
    )
    await service.create_pipeline(
        room_url="https://test.daily.co/room2",
        conversation_id="conv-2",
        token="token-2",
        user_id="user-2",
    )

    # Destroy all
    await service.destroy_all_pipelines()

    # Check both are destroyed
    assert service.get_pipeline_status("conv-1")["status"] == "not_found"
    assert service.get_pipeline_status("conv-2")["status"] == "not_found"
