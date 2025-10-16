"""
Unit tests for refactored ElevenLabsTextToSpeechService.

Tests verify:
- Backward compatibility with original interface
- Request stitching for voice consistency
- Streaming support via ElevenLabs SDK
- Proper error handling and fallback messaging
- Vietnamese voice synthesis configuration
"""

import base64
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from apps.api.src.services.text_to_speech_service import (
    ElevenLabsTextToSpeechService,
    TextToSpeechResult,
)


class TestTextToSpeechResult:
    """Test TextToSpeechResult data class."""

    def test_tts_result_creation(self):
        """Test creating a TTS result."""
        result = TextToSpeechResult(
            audio_url="data:audio/mpeg;base64,test",
            duration=2.5,
            text_tokens=50,
            audio_content_type="audio/mpeg",
            voice_id="voice-123",
        )

        assert result.audio_url == "data:audio/mpeg;base64,test"
        assert result.duration == 2.5
        assert result.text_tokens == 50
        assert result.audio_content_type == "audio/mpeg"
        assert result.voice_id == "voice-123"

    def test_tts_result_to_dict(self):
        """Test converting result to dict."""
        result = TextToSpeechResult(
            audio_url="data:audio/mpeg;base64,test",
            duration=2.5,
            text_tokens=50,
        )

        result_dict = result.to_dict()

        assert result_dict["audioUrl"] == "data:audio/mpeg;base64,test"
        assert result_dict["duration"] == 2.5
        assert result_dict["textTokens"] == 50


class TestElevenLabsTextToSpeechService:
    """Test the refactored TTS service using ElevenLabs Python SDK."""

    @pytest.fixture
    def service(self):
        """Create service instance with mocked config."""
        with patch("apps.api.src.services.text_to_speech_service.settings") as mock_settings:
            mock_settings.elevenlabs_api_key = "test-api-key"
            mock_settings.elevenlabs_voice_id = "test-voice-id"

            with patch(
                "apps.api.src.services.text_to_speech_service.ElevenLabs"
            ) as mock_client:
                service = ElevenLabsTextToSpeechService()
                service.client = mock_client
                return service

    def test_service_initialization(self, service):
        """Test service initializes with correct configuration."""
        assert service.voice_id == "test-voice-id"
        assert service.max_retries == 3
        assert service.max_text_length == 5000
        assert isinstance(service.request_ids, list)

    @pytest.mark.asyncio
    async def test_synthesize_text_basic(self, service):
        """Test basic text synthesis."""
        mock_audio = b"fake audio data"

        # Mock the streaming response
        service.client.text_to_speech.stream = MagicMock(
            return_value=iter([mock_audio])
        )

        result = await service.synthesize_text("Xin chào")

        assert isinstance(result, TextToSpeechResult)
        assert result.voice_id == "test-voice-id"
        assert result.text_tokens == 2  # "Xin chào" is 2 tokens
        assert "data:audio/mpeg;base64," in result.audio_url

    @pytest.mark.asyncio
    async def test_request_stitching_disabled(self, service):
        """Test that request stitching can be disabled."""
        mock_audio = b"fake audio data"
        service.client.text_to_speech.stream = MagicMock(
            return_value=iter([mock_audio])
        )

        await service.synthesize_text("Test", use_request_stitching=False)

        # Verify stream was called without previous_request_ids
        service.client.text_to_speech.stream.assert_called_once()
        call_args = service.client.text_to_speech.stream.call_args
        assert call_args[1]["previous_request_ids"] == []

    @pytest.mark.asyncio
    async def test_request_stitching_enabled(self, service):
        """Test request stitching maintains voice consistency."""
        mock_audio = b"fake audio data"

        # Add some request IDs to simulate previous calls
        service.request_ids = ["req-1", "req-2"]
        service.client.text_to_speech.stream = MagicMock(
            return_value=iter([mock_audio])
        )

        await service.synthesize_text("Test", use_request_stitching=True)

        # Verify stream was called with previous request IDs
        service.client.text_to_speech.stream.assert_called_once()
        call_args = service.client.text_to_speech.stream.call_args
        assert call_args[1]["previous_request_ids"] == ["req-1", "req-2"]

    @pytest.mark.asyncio
    async def test_request_stitching_limit(self, service):
        """Test that request IDs are limited to last 5 for memory efficiency."""
        mock_audio = b"fake audio data"

        # Add 6 request IDs
        service.request_ids = [f"req-{i}" for i in range(6)]
        original_count = len(service.request_ids)

        service.client.text_to_speech.stream = MagicMock(
            return_value=iter([mock_audio])
        )

        # This would normally add another ID
        await service.synthesize_text("Test", use_request_stitching=True)

        # Should still be limited (may vary based on implementation)
        assert len(service.request_ids) <= 5

    @pytest.mark.asyncio
    async def test_voice_settings_by_tone(self):
        """Test voice settings change based on emotional tone."""
        test_cases = [
            ("neutral", {"stability": 0.5, "similarity_boost": 0.75}),
            ("warm", {"stability": 0.6, "similarity_boost": 0.80}),
            ("empathetic", {"stability": 0.65, "similarity_boost": 0.85}),
        ]

        for tone, expected_settings in test_cases:
            settings = ElevenLabsTextToSpeechService._get_voice_settings(tone, 0.5)
            assert settings["similarity_boost"] == expected_settings["similarity_boost"]

    @pytest.mark.asyncio
    async def test_text_too_long_raises_error(self, service):
        """Test that text exceeding max length raises error."""
        long_text = "a" * (service.max_text_length + 1)

        with pytest.raises(ValueError) as exc_info:
            await service.synthesize_text(long_text)

        assert "exceeds maximum length" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_error_mapping_vietnamese(self):
        """Test error messages are mapped to Vietnamese."""
        error_msgs = {
            "invalid_api_key": "Lỗi xác thực. Vui lòng liên hệ hỗ trợ.",
            "rate_limit": "Quá nhiều yêu cầu. Vui lòng chờ một lát.",
            "timeout": "Yêu cầu hết thời gian chờ. Vui lòng thử lại.",
            "voice_not_found": "Giọng nói không khả dụng. Vui lòng thử lại sau.",
            "connection error": "Lỗi kết nối. Vui lòng kiểm tra internet.",
            "unknown": "Lỗi xảy ra khi tạo giọng nói. Vui lòng thử lại.",
        }

        for error_input, expected_output in error_msgs.items():
            result = ElevenLabsTextToSpeechService._map_error_to_vietnamese(error_input)
            assert isinstance(result, str)
            assert len(result) > 0
            # Should be Vietnamese (contains non-ASCII)
            assert any(ord(c) > 127 for c in result)

    def test_backward_compatibility_interface(self):
        """Test service maintains backward-compatible interface."""
        # Verify class has all expected methods and attributes
        assert hasattr(ElevenLabsTextToSpeechService, "synthesize_text")
        assert hasattr(
            ElevenLabsTextToSpeechService, "_get_voice_settings"
        )
        assert hasattr(
            ElevenLabsTextToSpeechService, "_map_error_to_vietnamese"
        )
        assert hasattr(TextToSpeechResult, "to_dict")


class TestSDKIntegration:
    """Test that service properly uses ElevenLabs Python SDK."""

    def test_uses_elevenlabs_sdk(self):
        """Verify service imports and uses ElevenLabs SDK."""
        import apps.api.src.services.text_to_speech_service as module

        # Check that ElevenLabs is imported
        assert hasattr(module, "ElevenLabs")

    @pytest.mark.asyncio
    async def test_respects_configuration(self):
        """Test service respects configuration parameters."""
        with patch(
            "apps.api.src.services.text_to_speech_service.settings"
        ) as mock_settings:
            mock_settings.elevenlabs_api_key = "custom-api-key"
            mock_settings.elevenlabs_voice_id = "custom-voice-id"

            with patch(
                "apps.api.src.services.text_to_speech_service.ElevenLabs"
            ) as mock_client:
                service = ElevenLabsTextToSpeechService()

                # Verify config was used
                assert service.voice_id == "custom-voice-id"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
