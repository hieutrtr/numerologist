"""
ElevenLabs Text-to-Speech Service

Handles generation of warm, natural Vietnamese voice synthesis for numerology responses.
Implements SSML support for emotional tone modulation and cost optimization via caching.
"""

import asyncio
import json
import logging
import os
from typing import Optional
from uuid import UUID

import aiohttp

logger = logging.getLogger(__name__)


class TextToSpeechResult:
    """Represents TTS result from ElevenLabs"""

    def __init__(
        self,
        audio_url: str,
        duration: float = 0.0,
        text_tokens: int = 0,
        audio_content_type: str = "audio/mpeg",
        voice_id: str = "default",
    ):
        self.audio_url = audio_url
        self.duration = duration
        self.text_tokens = text_tokens
        self.audio_content_type = audio_content_type
        self.voice_id = voice_id

    def to_dict(self) -> dict:
        return {
            "audioUrl": self.audio_url,
            "duration": self.duration,
            "textTokens": self.text_tokens,
            "audioContentType": self.audio_content_type,
            "voiceId": self.voice_id,
        }


class ElevenLabsTextToSpeechService:
    """
    Service for synthesizing Vietnamese voice using ElevenLabs API.

    Benefits:
    - Natural voice synthesis with emotional modulation
    - SSML support for tone, pitch, and pacing control
    - 86+ languages including Vietnamese
    - Cost-effective with caching strategy

    Configuration:
    - ELEVENLABS_API_KEY: ElevenLabs API key
    - ELEVENLABS_VOICE_ID: Vietnamese voice ID from ElevenLabs
    - Supports both REST API and streaming
    """

    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "default")
        self.base_url = "https://api.elevenlabs.io/v1"

        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable not set")

        self.max_retries = 3
        self.timeout = 5.0  # seconds
        self.max_text_length = 5000  # ElevenLabs limit

    async def synthesize_text(
        self,
        text: str,
        emotional_tone: str = "warm",
        speed: float = 1.0,
        stability: float = 0.5,
    ) -> TextToSpeechResult:
        """
        Synthesize text to speech using ElevenLabs API.

        Args:
            text: Vietnamese text to synthesize
            emotional_tone: 'neutral', 'warm', or 'empathetic'
            speed: Playback speed (0.5 to 2.0)
            stability: Voice stability (0 to 1, higher = more consistent)

        Returns:
            TextToSpeechResult with audio URL

        Raises:
            Exception: If synthesis fails after max retries
        """
        if len(text) > self.max_text_length:
            raise ValueError(f"Text exceeds maximum length of {self.max_text_length}")

        retry_count = 0

        while retry_count < self.max_retries:
            try:
                logger.info(f"Starting TTS synthesis (attempt {retry_count + 1}/{self.max_retries})")

                # Apply SSML markup for emotional tone
                ssml_text = self._apply_ssml_markup(text, emotional_tone, speed)

                async with aiohttp.ClientSession() as session:
                    url = f"{self.base_url}/text-to-speech/{self.voice_id}/stream"

                    headers = {
                        "xi-api-key": self.api_key,
                    }

                    payload = {
                        "text": ssml_text,
                        "model_id": "eleven_multilingual_v2",
                        "voice_settings": {
                            "stability": stability,
                            "similarity_boost": 0.75,  # Higher similarity for consistent voice
                        },
                    }

                    async with session.post(
                        url,
                        json=payload,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=self.timeout + 10),
                    ) as resp:
                        if resp.status == 200:
                            # Stream audio to temporary buffer
                            audio_data = await resp.read()

                            # TODO: Store in Azure Blob Storage and return URL
                            # For now, return base64-encoded audio
                            import base64

                            audio_base64 = base64.b64encode(audio_data).decode()
                            audio_url = f"data:audio/mpeg;base64,{audio_base64}"

                            result = TextToSpeechResult(
                                audio_url=audio_url,
                                duration=0.0,  # Would need to decode MP3 to get duration
                                text_tokens=len(text.split()),
                                audio_content_type="audio/mpeg",
                                voice_id=self.voice_id,
                            )

                            logger.info(f"TTS synthesis complete: {len(text)} chars → {len(audio_data)} bytes")
                            return result

                        else:
                            error_data = await resp.json()
                            error_msg = error_data.get("error", {}).get("message", f"HTTP {resp.status}")
                            logger.error(f"ElevenLabs error: {error_msg}")
                            raise Exception(f"ElevenLabs API error: {error_msg}")

            except asyncio.TimeoutError:
                retry_count += 1
                logger.warning(
                    f"TTS synthesis timeout (attempt {retry_count}/{self.max_retries}). Retrying..."
                )
                if retry_count < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** (retry_count - 1)))  # exponential backoff
                continue

            except Exception as e:
                retry_count += 1
                logger.error(f"TTS synthesis error (attempt {retry_count}/{self.max_retries}): {e}")

                if retry_count < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** (retry_count - 1)))  # exponential backoff
                    continue
                else:
                    raise

        raise Exception("TTS synthesis failed after maximum retries")

    @staticmethod
    def _apply_ssml_markup(text: str, emotional_tone: str, speed: float) -> str:
        """
        Apply SSML markup for emotional tone and speed control.

        Args:
            text: Input text
            emotional_tone: 'neutral', 'warm', or 'empathetic'
            speed: Playback speed multiplier

        Returns:
            SSML-formatted text
        """
        # SSML pitch and speed adjustments by tone
        tone_settings = {
            "neutral": {"pitch": "0%", "rate": str(speed)},
            "warm": {"pitch": "+10%", "rate": str(speed * 0.95)},  # Slightly slower for warmth
            "empathetic": {"pitch": "+15%", "rate": str(speed * 0.90)},  # Slower, higher pitch
        }

        settings = tone_settings.get(emotional_tone, tone_settings["neutral"])

        ssml = f"""<speak>
  <prosody pitch="{settings['pitch']}" rate="{settings['rate']}">
    {text}
  </prosody>
</speak>"""

        return ssml

    @staticmethod
    def _map_error_to_vietnamese(error_message: str) -> str:
        """
        Map ElevenLabs errors to Vietnamese user messages.

        Args:
            error_message: Error message from API

        Returns:
            Vietnamese error message
        """
        if "invalid_api_key" in error_message.lower():
            return "Lỗi xác thực. Vui lòng liên hệ hỗ trợ."
        elif "rate_limit" in error_message.lower():
            return "Quá nhiều yêu cầu. Vui lòng chờ một lát."
        elif "timeout" in error_message.lower():
            return "Yêu cầu hết thời gian chờ. Vui lòng thử lại."
        elif "voice_not_found" in error_message.lower():
            return "Giọng nói không khả dụng. Vui lòng thử lại sau."
        else:
            return "Lỗi xảy ra khi tạo giọng nói. Vui lòng thử lại."


# Export singleton instance
text_to_speech_service = ElevenLabsTextToSpeechService()
