"""Voice transcription endpoints leveraging Azure OpenAI STT."""

from __future__ import annotations

import logging
import time
from typing import AsyncGenerator, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, File, Header, UploadFile, status
from fastapi.responses import JSONResponse

from apps.api.src.schemas.voice import (
    TranscriptionErrorResponse,
    TranscriptionResponse,
)
from apps.api.src.services.voice_service import TranscriptionResult, voice_service

logger = logging.getLogger(__name__)

ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp3",
    "audio/mpeg",
    "audio/flac",
}

router = APIRouter(prefix="/v1/voice", tags=["voice"])


def _estimate_duration_ms(audio_bytes: bytes, sample_rate: int = 16000) -> float:
    """Estimate audio duration assuming 16-bit PCM mono audio."""
    if not audio_bytes:
        return 0.0
    bytes_per_sample = 2  # 16-bit PCM
    total_samples = len(audio_bytes) / bytes_per_sample
    duration_seconds = total_samples / float(sample_rate)
    return duration_seconds * 1000.0


async def _bytes_to_stream(
    data: bytes, chunk_size: int = 4096
) -> AsyncGenerator[bytes, None]:
    """Convert raw bytes into an async generator consumed by the STT service."""
    for index in range(0, len(data), chunk_size):
        yield data[index : index + chunk_size]


def _build_error(
    *, error_code: str, message: str, request_id: str
) -> TranscriptionErrorResponse:
    """Build a standardized transcription error response."""
    return TranscriptionErrorResponse(
        error={
            "error_code": error_code,
            "message": message,
            "request_id": request_id,
        }
    )


@router.post(
    "/transcriptions",
    response_model=TranscriptionResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": TranscriptionErrorResponse,
            "description": "Đầu vào không hợp lệ",
        },
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {
            "model": TranscriptionErrorResponse,
            "description": "Định dạng âm thanh không được hỗ trợ",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": TranscriptionErrorResponse,
            "description": "Lỗi hệ thống",
        },
    },
    summary="Transcribe Vietnamese audio to text",
    description="Uploads an audio clip and returns the Vietnamese transcript using Azure OpenAI gpt-4o-mini-transcribe.",
)
async def create_transcription(
    audio_file: UploadFile = File(..., description="PCM16 mono WAV audio file"),
    x_user_id: Optional[UUID] = Header(None, alias="x-user-id"),
    request_id: Optional[str] = Header(None, alias="x-request-id"),
) -> TranscriptionResponse:
    """Transcribe uploaded audio using Azure OpenAI STT."""

    req_id = request_id or str(uuid4())
    start_time = time.perf_counter()

    if audio_file.content_type not in ALLOWED_AUDIO_TYPES:
        logger.warning(
            "Unsupported audio content type",
            extra={
                "request_id": req_id,
                "content_type": audio_file.content_type,
            },
        )
        error = _build_error(
            error_code="UNSUPPORTED_MEDIA_TYPE",
            message="Định dạng âm thanh không được hỗ trợ. Vui lòng gửi tệp WAV (PCM16).",
            request_id=req_id,
        )
        return JSONResponse(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            content=error.model_dump(),
        )

    audio_bytes = await audio_file.read()
    if not audio_bytes:
        logger.warning(
            "Empty audio payload",
            extra={"request_id": req_id, "audio_filename": audio_file.filename},
        )
        error = _build_error(
            error_code="EMPTY_AUDIO",
            message="Không nhận được dữ liệu âm thanh. Vui lòng thu âm lại.",
            request_id=req_id,
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error.model_dump(),
        )

    duration_ms = _estimate_duration_ms(audio_bytes)

    async def audio_stream() -> AsyncGenerator[bytes, None]:
        async for chunk in _bytes_to_stream(audio_bytes):
            yield chunk

    try:
        transcription: Optional[TranscriptionResult] = None
        async for result in voice_service.transcribe_audio_stream(
            audio_stream(), user_id=x_user_id
        ):
            transcription = result
            break

        if transcription is None:
            logger.error(
                "No transcription result returned",
                extra={"request_id": req_id},
            )
            error = _build_error(
                error_code="NO_TRANSCRIPTION",
                message="Không thể tạo bản chép lời. Vui lòng thử lại.",
                request_id=req_id,
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error.model_dump(),
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            "Transcription complete",
            extra={
                "request_id": req_id,
                "user_id": str(x_user_id) if x_user_id else None,
                "duration_ms": duration_ms,
                "latency_ms": round(elapsed_ms, 2),
                "confidence": transcription.confidence,
            },
        )

        return TranscriptionResponse(
            text=transcription.text,
            confidence=transcription.confidence,
            alternatives=[
                {
                    "text": alt.get("text", ""),
                    "confidence": alt.get("confidence", 0.0),
                }
                for alt in transcription.alternatives
            ],
            duration_ms=duration_ms,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Transcription failed",
            extra={"request_id": req_id, "error": str(exc)},
        )
        error = _build_error(
            error_code="TRANSCRIPTION_FAILED",
            message="Không thể xử lý âm thanh. Vui lòng thử lại sau.",
            request_id=req_id,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error.model_dump(),
        )
