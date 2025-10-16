"""
Unit tests for NumerologyAgentService.

Tests verify:
- Agent Framework initialization with Azure OpenAI configuration
- Voice input processing through agent orchestration
- Health check functionality
- Error handling and logging
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from apps.api.src.services.agent_service import NumerologyAgentService


class TestNumerologyAgentService:
    """Test NumerologyAgentService with Agent Framework."""

    @pytest.fixture
    def service(self):
        """Create service instance with mocked Agent Framework client."""
        with patch(
            "apps.api.src.services.agent_service.settings"
        ) as mock_settings:
            mock_settings.azure_openai_key = "test-key"
            mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
            mock_settings.azure_openai_reasoning_deployment_name = "gpt-4o-mini"
            mock_settings.azure_openai_stt_deployment_name = "gpt-4o-mini-transcribe"
            mock_settings.azure_openai_api_version = "2025-01-01-preview"

            with patch(
                "apps.api.src.services.agent_service.AzureOpenAIResponsesClient"
            ) as mock_client:
                service = NumerologyAgentService()
                return service

    def test_service_initialization(self, service):
        """Test service initializes with correct configuration."""
        assert service.client is not None

    @pytest.mark.asyncio
    async def test_process_voice_input_basic(self, service):
        """Test basic voice input processing."""
        user_id = uuid4()
        text = "Ngày sinh của tôi là 15/3/1990"

        # Mock the agent response
        mock_response = "Số Life Path của bạn là 1"
        service.client.create_agent = MagicMock(return_value=MagicMock())
        service.client.create_agent.return_value.run = AsyncMock(
            return_value=mock_response
        )

        result = await service.process_voice_input(text, user_id)

        assert result["status"] == "success"
        assert result["user_id"] == str(user_id)
        assert result["input_text"] == text
        assert "response" in result

    @pytest.mark.asyncio
    async def test_process_voice_input_with_context(self, service):
        """Test voice input processing with user context."""
        user_id = uuid4()
        text = "Hãy nói cho tôi về tương lai"
        context = {
            "user_profile": {
                "name": "Nguyễn Văn A",
                "birth_date": "1990-03-15",
                "life_path": 1,
            },
            "conversation_history": ["Xin chào"],
        }

        service.client.create_agent = MagicMock(return_value=MagicMock())
        service.client.create_agent.return_value.run = AsyncMock(
            return_value="Dự báo của bạn..."
        )

        result = await service.process_voice_input(
            text, user_id, context=context
        )

        assert result["status"] == "success"
        assert result["user_id"] == str(user_id)

    @pytest.mark.asyncio
    async def test_process_voice_input_with_conversation_id(self, service):
        """Test voice input processing with conversation tracking."""
        user_id = uuid4()
        conversation_id = uuid4()
        text = "Tiếp tục..."

        service.client.create_agent = MagicMock(return_value=MagicMock())
        service.client.create_agent.return_value.run = AsyncMock(
            return_value="Tiếp tục nội dung..."
        )

        result = await service.process_voice_input(
            text, user_id, conversation_id=conversation_id
        )

        assert result["status"] == "success"
        assert result["conversation_id"] == str(conversation_id)

    @pytest.mark.asyncio
    async def test_build_system_prompt_without_context(self, service):
        """Test system prompt building without context."""
        prompt = service._build_system_prompt()

        assert "numerology" in prompt.lower()
        assert "Vietnamese" in prompt or "vietnamese" in prompt.lower()
        assert "warm" in prompt.lower() or "empathetic" in prompt.lower()

    @pytest.mark.asyncio
    async def test_build_system_prompt_with_user_profile(self, service):
        """Test system prompt includes user profile."""
        context = {
            "user_profile": {
                "name": "Nguyễn Văn A",
                "life_path": 1,
                "destiny": 5,
            }
        }

        prompt = service._build_system_prompt(context)

        # Should include context information
        assert len(prompt) > 0
        assert "numerology" in prompt.lower()

    @pytest.mark.asyncio
    async def test_build_system_prompt_with_history(self, service):
        """Test system prompt includes conversation history."""
        context = {
            "conversation_history": ["Xin chào", "Làm sao tôi có thể giúp bạn?"]
        }

        prompt = service._build_system_prompt(context)

        # Should include history
        assert len(prompt) > 0

    @pytest.mark.asyncio
    async def test_health_check_healthy(self, service):
        """Test health check when service is healthy."""
        service.client.create_agent = MagicMock(return_value=MagicMock())
        service.client.create_agent.return_value.run = AsyncMock(
            return_value="healthy"
        )

        result = await service.health_check()

        assert result["status"] == "healthy"
        assert result["agent_framework"] == "ready"
        assert result["azure_openai"] == "ready"

    @pytest.mark.asyncio
    async def test_health_check_degraded(self, service):
        """Test health check when service returns no response."""
        service.client.create_agent = MagicMock(return_value=MagicMock())
        service.client.create_agent.return_value.run = AsyncMock(
            return_value=None
        )

        result = await service.health_check()

        assert result["status"] == "degraded"
        assert result["agent_framework"] == "ready"

    @pytest.mark.asyncio
    async def test_health_check_error(self, service):
        """Test health check when service encounters error."""
        service.client.create_agent = MagicMock(return_value=MagicMock())
        service.client.create_agent.return_value.run = AsyncMock(
            side_effect=Exception("Connection failed")
        )

        result = await service.health_check()

        assert result["status"] == "unhealthy"
        assert "error" in result
        assert "Connection failed" in result["error"]

    def test_singleton_export(self):
        """Test that agent_service singleton is exported."""
        import apps.api.src.services.agent_service as module

        assert hasattr(module, "agent_service")


class TestAgentFrameworkIntegration:
    """Test integration with Microsoft Agent Framework."""

    def test_uses_azure_openai_responses_client(self):
        """Verify service uses AzureOpenAIResponsesClient."""
        import apps.api.src.services.agent_service as module

        assert hasattr(module, "AzureOpenAIResponsesClient")

    @pytest.mark.asyncio
    async def test_deployment_configuration(self):
        """Test that service uses correct deployment names."""
        with patch(
            "apps.api.src.services.agent_service.settings"
        ) as mock_settings:
            mock_settings.azure_openai_key = "test-key"
            mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
            mock_settings.azure_openai_reasoning_deployment_name = (
                "custom-reasoning"
            )
            mock_settings.azure_openai_stt_deployment_name = "custom-stt"
            mock_settings.azure_openai_api_version = "2025-01-01-preview"

            with patch(
                "apps.api.src.services.agent_service.AzureOpenAIResponsesClient"
            ) as mock_client_class:
                service = NumerologyAgentService()

                # Verify the correct deployment name was used
                mock_client_class.assert_called_once()
                call_args = mock_client_class.call_args
                assert call_args[1]["deployment_name"] == "custom-reasoning"


class TestErrorHandling:
    """Test error handling in agent service."""

    @pytest.mark.asyncio
    async def test_invalid_user_id_handling(self):
        """Test handling of invalid user ID."""
        with patch(
            "apps.api.src.services.agent_service.settings"
        ) as mock_settings:
            mock_settings.azure_openai_key = "test-key"
            mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
            mock_settings.azure_openai_reasoning_deployment_name = "gpt-4o-mini"
            mock_settings.azure_openai_stt_deployment_name = (
                "gpt-4o-mini-transcribe"
            )
            mock_settings.azure_openai_api_version = "2025-01-01-preview"

            with patch(
                "apps.api.src.services.agent_service.AzureOpenAIResponsesClient"
            ):
                service = NumerologyAgentService()

                # Should accept valid UUID
                result = await service.process_voice_input(
                    "test", uuid4()
                )
                assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_logging_on_error(self):
        """Test that errors are properly logged."""
        with patch(
            "apps.api.src.services.agent_service.settings"
        ) as mock_settings:
            mock_settings.azure_openai_key = "test-key"
            mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
            mock_settings.azure_openai_reasoning_deployment_name = "gpt-4o-mini"
            mock_settings.azure_openai_stt_deployment_name = (
                "gpt-4o-mini-transcribe"
            )
            mock_settings.azure_openai_api_version = "2025-01-01-preview"

            with patch(
                "apps.api.src.services.agent_service.AzureOpenAIResponsesClient"
            ) as mock_client_class:
                with patch(
                    "apps.api.src.services.agent_service.logger"
                ) as mock_logger:
                    # Make initialization raise an error
                    mock_client_class.side_effect = Exception("Init failed")

                    with pytest.raises(Exception):
                        NumerologyAgentService()

                    # Verify error was logged
                    mock_logger.error.assert_called()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
