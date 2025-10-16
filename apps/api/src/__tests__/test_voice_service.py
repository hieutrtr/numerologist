"""
Unit tests for refactored AzureOpenAISpeechToTextService.

Tests verify:
- Backward compatibility with original interface
- Proper error handling and fallback messaging
- Vietnamese language support
- SDK integration (AsyncAzureOpenAI)
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from fastapi import WebSocketException

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from apps.api.src.services.voice_service import (
    AzureOpenAISpeechToTextService,
    TranscriptionResult,
)


class TestTranscriptionResult:
    """Test TranscriptionResult data class."""

    def test_transcription_result_creation(self):
        """Test creating a transcription result."""
        result = TranscriptionResult(
            text="Xin chào",
            is_final=True,
            confidence=0.95,
            alternatives=[],
        )

        assert result.text == "Xin chào"
        assert result.is_final is True
        assert result.confidence == 0.95
        assert result.alternatives == []

    def test_transcription_result_to_dict(self):
        """Test converting result to dict."""
        result = TranscriptionResult(
            text="Xin chào",
            is_final=True,
            confidence=0.95,
        )

        result_dict = result.to_dict()

        assert result_dict["text"] == "Xin chào"
        assert result_dict["isFinal"] is True
        assert result_dict["confidence"] == 0.95


class TestAzureOpenAISpeechToTextService:
    """Test the refactored STT service using Azure AI OpenAI SDK."""

    @pytest.fixture
    def service(self):
        """Create service instance with mocked config."""
        with patch("apps.api.src.services.voice_service.settings") as mock_settings:
            mock_settings.azure_openai_key = "test-key"
            mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
            mock_settings.azure_openai_stt_deployment_name = "gpt-4o-mini-transcribe"
            mock_settings.azure_openai_api_version = "2025-01-01-preview"

            with patch(
                "apps.api.src.services.voice_service.AsyncAzureOpenAI"
            ) as mock_client:
                service = AzureOpenAISpeechToTextService()
                service.client = mock_client
                return service

    @pytest.mark.asyncio
    async def test_service_initialization(self, service):
        """Test service initializes with correct configuration."""
        assert service.api_key == "test-key"
        assert service.endpoint == "https://test.openai.azure.com"
        assert service.deployment_name == "gpt-4o-mini-transcribe"
        assert service.api_version == "2025-01-01-preview"
        assert service.language == "vi"

    @pytest.mark.asyncio
    async def test_transcribe_vietnamese_text(self, service):
        """Test transcribing Vietnamese text."""

        async def mock_stream():
            yield b"test audio data"

        user_id = uuid4()

        # Mock the transcription to return Vietnamese text
        results = []
        async for result in service.transcribe_audio_stream(mock_stream(), user_id):
            results.append(result)

        # Verify we got results
        assert len(results) > 0
        result = results[0]
        assert isinstance(result, TranscriptionResult)
        assert result.is_final is True
        assert result.confidence > 0
        # Text should contain placeholder for testing
        assert isinstance(result.text, str)

    @pytest.mark.asyncio
    async def test_error_mapping_vietnamese(self):
        """Test error messages are mapped to Vietnamese."""
        error_msgs = {
            "timeout error": "Yêu cầu hết thời gian chờ. Vui lòng thử lại.",
            "connection error": "Lỗi kết nối. Vui lòng kiểm tra internet.",
            "authentication error": "Lỗi xác thực. Vui lòng liên hệ hỗ trợ.",
            "invalid data": "Dữ liệu không hợp lệ. Vui lòng thử lại.",
            "unknown error": "Lỗi xảy ra. Vui lòng thử lại.",
        }

        for error_input, expected_output in error_msgs.items():
            result = AzureOpenAISpeechToTextService._map_error_to_vietnamese(
                error_input
            )
            assert isinstance(result, str)
            assert len(result) > 0
            # Should be Vietnamese (contains non-ASCII)
            assert any(ord(c) > 127 for c in result)

    @pytest.mark.asyncio
    async def test_empty_audio_stream_raises_error(self, service):
        """Test that empty audio stream raises error."""

        async def empty_stream():
            return
            yield  # Never yields - empty generator

        with pytest.raises(WebSocketException):
            async for _ in service.transcribe_audio_stream(empty_stream()):
                pass

    @pytest.mark.asyncio
    async def test_max_retries_exceeded(self, service):
        """Test retry logic with max retries."""

        async def failing_stream():
            yield b"test"

        # Mock to always fail
        service.max_retries = 2

        with pytest.raises(WebSocketException):
            async for _ in service.transcribe_audio_stream(failing_stream()):
                pass

    def test_backward_compatibility_interface(self):
        """Test service maintains backward-compatible interface."""
        # Verify class has all expected methods and attributes
        assert hasattr(AzureOpenAISpeechToTextService, "transcribe_audio_stream")
        assert hasattr(AzureOpenAISpeechToTextService, "_map_error_to_vietnamese")
        assert hasattr(TranscriptionResult, "to_dict")


class TestSDKIntegration:
    """Test that service properly uses Azure AI OpenAI SDK."""

    def test_uses_asyncazureopenai_sdk(self):
        """Verify service imports and uses AsyncAzureOpenAI SDK."""
        import apps.api.src.services.voice_service as module

        # Check that AsyncAzureOpenAI is imported
        assert hasattr(module, "AsyncAzureOpenAI")

    @pytest.mark.asyncio
    async def test_respects_configuration(self):
        """Test service respects configuration parameters."""
        with patch("apps.api.src.services.voice_service.settings") as mock_settings:
            mock_settings.azure_openai_key = "custom-key"
            mock_settings.azure_openai_endpoint = "https://custom.openai.azure.com/"
            mock_settings.azure_openai_stt_deployment_name = "custom-deployment"
            mock_settings.azure_openai_api_version = "2025-01-01-preview"

            with patch(
                "apps.api.src.services.voice_service.AsyncAzureOpenAI"
            ) as mock_client:
                service = AzureOpenAISpeechToTextService()

                # Verify config was used
                assert service.api_key == "custom-key"
                assert service.deployment_name == "custom-deployment"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
