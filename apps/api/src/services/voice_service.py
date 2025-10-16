"""
Azure Speech-to-Text Service

Handles transcription of Vietnamese audio using Azure Cognitive Services.
Implements WebSocket streaming for real-time transcription.
"""

import asyncio
import json
import logging
import os
from typing import AsyncGenerator, Optional
from uuid import UUID

import aiohttp
from fastapi import WebSocketException

logger = logging.getLogger(__name__)


class TranscriptionResult:
    """Represents speech transcription result from Azure"""

    def __init__(
        self,
        text: str,
        is_final: bool = False,
        confidence: float = 1.0,
        alternatives: Optional[list[dict]] = None,
    ):
        self.text = text
        self.is_final = is_final
        self.confidence = confidence
        self.alternatives = alternatives or []

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "isFinal": self.is_final,
            "confidence": self.confidence,
            "alternatives": self.alternatives,
        }


class AzureSpeechToTextService:
    """
    Service for transcribing Vietnamese audio using Azure Speech Services.

    Configuration:
    - AZURE_SPEECH_KEY: Azure subscription key
    - AZURE_SPEECH_REGION: Azure region (southeastasia for Vietnamese users)
    - Language: vi-VN (Vietnamese)
    - Audio Format: 16-bit PCM mono, 16kHz sample rate
    """

    def __init__(self):
        self.subscription_key = os.getenv("AZURE_SPEECH_KEY")
        self.region = os.getenv("AZURE_SPEECH_REGION", "southeastasia")

        if not self.subscription_key:
            raise ValueError("AZURE_SPEECH_KEY environment variable not set")

        self.base_url = (
            f"https://{self.region}.stt.speech.microsoft.com/speech/recognition/"
            "conversation/cognitiveservices/v1"
        )
        self.websocket_url = (
            f"wss://{self.region}.stt.speech.microsoft.com/speech/recognition/"
            "conversation/cognitiveservices/v1"
        )
        self.language = "vi-VN"
        self.max_retries = 3
        self.timeout = 5.0  # seconds

    async def transcribe_audio_stream(
        self,
        audio_stream: AsyncGenerator[bytes, None],
        user_id: Optional[UUID] = None,
    ) -> AsyncGenerator[TranscriptionResult, None]:
        """
        Transcribe audio stream from WebSocket.

        Args:
            audio_stream: AsyncGenerator yielding audio chunks
            user_id: Optional user ID for logging/context

        Yields:
            TranscriptionResult objects as they become available

        Raises:
            WebSocketException: If transcription fails or timeout occurs
        """
        retry_count = 0

        while retry_count < self.max_retries:
            try:
                logger.info(
                    f"Starting transcription (attempt {retry_count + 1}/{self.max_retries})"
                )

                # Connect to Azure WebSocket
                async with aiohttp.ClientSession() as session:
                    # Prepare WebSocket URL with parameters
                    ws_url = f"{self.websocket_url}?language={self.language}"

                    # Connect with authentication header
                    headers = {
                        "Ocp-Apim-Subscription-Key": self.subscription_key,
                    }

                    async with session.ws_connect(
                        ws_url, headers=headers, timeout=aiohttp.ClientTimeout(
                            total=self.timeout
                        )
                    ) as ws:
                        # Send initial configuration
                        config = {
                            "context": {
                                "system": {
                                    "version": "1.0.0b10",
                                }
                            }
                        }
                        await ws.send_json(config)
                        logger.debug("Sent WebSocket configuration to Azure")

                        # Create tasks for sending audio and receiving results
                        send_task = asyncio.create_task(
                            self._send_audio_chunks(ws, audio_stream)
                        )
                        receive_task = asyncio.create_task(
                            self._receive_transcriptions(ws)
                        )

                        # Wait for both tasks (receive will complete when Azure sends final result)
                        done, pending = await asyncio.wait(
                            [send_task, receive_task],
                            return_when=asyncio.FIRST_COMPLETED,
                        )

                        # Process received transcriptions
                        if receive_task in done:
                            async for result in self._receive_transcriptions(ws):
                                yield result
                        else:
                            # Cancel pending tasks
                            for task in pending:
                                task.cancel()

                return  # Success - exit retry loop

            except asyncio.TimeoutError:
                retry_count += 1
                logger.warning(
                    f"Transcription timeout (attempt {retry_count}/{self.max_retries}). Retrying..."
                )
                if retry_count < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** (retry_count - 1)))  # exponential backoff
                continue

            except Exception as e:
                retry_count += 1
                logger.error(
                    f"Transcription error (attempt {retry_count}/{self.max_retries}): {e}"
                )

                if retry_count < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** (retry_count - 1)))  # exponential backoff
                    continue
                else:
                    # Convert to WebSocketException for frontend
                    error_msg = self._map_error_to_vietnamese(str(e))
                    raise WebSocketException(code=1011, reason=error_msg)

        # If we exhausted retries
        raise WebSocketException(
            code=1011,
            reason="Transcription failed after maximum retries. Please try again.",
        )

    async def _send_audio_chunks(
        self,
        ws: aiohttp.ClientWebSocketResponse,
        audio_stream: AsyncGenerator[bytes, None],
    ) -> None:
        """
        Send audio chunks to Azure WebSocket.

        Args:
            ws: WebSocket connection
            audio_stream: AsyncGenerator yielding audio bytes
        """
        try:
            async for chunk in audio_stream:
                if chunk:
                    # Send audio chunk with binary format
                    await ws.send_bytes(chunk)
                    logger.debug(f"Sent {len(chunk)} bytes to Azure")

            # Send empty message to signal end of stream
            await ws.send_bytes(b"")
            logger.debug("Sent end-of-stream signal to Azure")

        except Exception as e:
            logger.error(f"Error sending audio: {e}")
            raise

    async def _receive_transcriptions(
        self,
        ws: aiohttp.ClientWebSocketResponse,
    ) -> AsyncGenerator[TranscriptionResult, None]:
        """
        Receive and parse transcription results from Azure WebSocket.

        Args:
            ws: WebSocket connection

        Yields:
            TranscriptionResult objects
        """
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        logger.debug(f"Received message from Azure: {data}")

                        # Parse speech.phrase event (final result)
                        if data.get("Result") == "Success":
                            # Extract final transcription
                            text = data.get("DisplayText", "")
                            nbest = data.get("NBest", [{}])[0]
                            confidence = nbest.get("Confidence", 0.0)

                            result = TranscriptionResult(
                                text=text,
                                is_final=True,
                                confidence=confidence,
                                alternatives=self._extract_alternatives(
                                    data.get("NBest", [])
                                ),
                            )
                            logger.info(
                                f"Final result: {text} (confidence: {confidence})"
                            )
                            yield result

                        # Parse speech.hypothesis event (partial result)
                        elif "RecognitionStatus" in data:
                            if data["RecognitionStatus"] == "Success":
                                text = data.get("DisplayText", "")
                                if text:
                                    result = TranscriptionResult(
                                        text=text,
                                        is_final=False,
                                        confidence=0.0,  # Partial result
                                    )
                                    logger.debug(f"Partial result: {text}")
                                    yield result

                        # Handle Azure error responses
                        elif data.get("Result") == "Failed":
                            error_msg = data.get("Error", {}).get(
                                "Message", "Unknown error"
                            )
                            logger.error(f"Azure error: {error_msg}")
                            error_code = data.get("Error", {}).get("Code")

                            # Map Azure error to Vietnamese message
                            vietnamese_msg = self._map_azure_error_to_vietnamese(
                                error_code
                            )
                            raise WebSocketException(
                                code=1011, reason=vietnamese_msg
                            )

                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse Azure response: {e}")
                        raise

                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {ws.exception()}")
                    raise WebSocketException(
                        code=1011,
                        reason="WebSocket connection error",
                    )

                elif msg.type == aiohttp.WSMsgType.CLOSED:
                    logger.info("WebSocket connection closed")
                    break

        except Exception as e:
            logger.error(f"Error receiving transcriptions: {e}")
            raise

    @staticmethod
    def _extract_alternatives(nbest_list: list[dict]) -> list[dict]:
        """
        Extract alternative transcriptions from NBest array.

        Args:
            nbest_list: List of recognition candidates

        Returns:
            List of alternatives with text and confidence
        """
        return [
            {
                "text": item.get("Display", ""),
                "confidence": item.get("Confidence", 0.0),
            }
            for item in nbest_list[1:]  # Skip first (already used as primary)
        ]

    @staticmethod
    def _map_azure_error_to_vietnamese(error_code: Optional[str]) -> str:
        """
        Map Azure error codes to Vietnamese user-facing messages.

        Args:
            error_code: Azure error code

        Returns:
            Vietnamese error message
        """
        error_map = {
            "NoMatch": "Không nhận diện được giọng nói. Vui lòng thử lại.",
            "InitialSilenceTimeout": "Không phát hiện được âm thanh. Vui lòng nói rõ hơn.",
            "BabbleTimeout": "Âm thanh nền quá lớn. Vui lòng thử ở nơi yên tĩnh hơn.",
            "Error": "Lỗi kết nối. Vui lòng kiểm tra kết nối internet.",
            "Timeout": "Yêu cầu hết thời gian chờ. Vui lòng thử lại.",
            "ServiceUnavailable": "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
        }
        return error_map.get(
            error_code,
            "Lỗi không xác định. Vui lòng thử lại.",
        )

    @staticmethod
    def _map_error_to_vietnamese(error_message: str) -> str:
        """
        Map general errors to Vietnamese messages.

        Args:
            error_message: Error message

        Returns:
            Vietnamese error message
        """
        if "timeout" in error_message.lower():
            return "Yêu cầu hết thời gian chờ. Vui lòng thử lại."
        elif "connection" in error_message.lower():
            return "Lỗi kết nối. Vui lòng kiểm tra internet."
        elif "authentication" in error_message.lower():
            return "Lỗi xác thực. Vui lòng liên hệ hỗ trợ."
        else:
            return "Lỗi xảy ra. Vui lòng thử lại."


# Export singleton instance
voice_service = AzureSpeechToTextService()
