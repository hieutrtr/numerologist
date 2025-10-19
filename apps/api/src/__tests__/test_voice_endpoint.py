"""Tests for voice transcription REST endpoint."""

import os
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

# Ensure project root is on sys.path for module imports
project_root = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(project_root))

# Ensure Azure OpenAI configuration exists before app imports settings
os.environ.setdefault("AZURE_OPENAI_KEY", "test-key")
os.environ.setdefault("AZURE_OPENAI_ENDPOINT", "https://test.openai.azure.com")
os.environ.setdefault("AZURE_OPENAI_STT_DEPLOYMENT_NAME", "gpt-4o-mini-transcribe")
os.environ.setdefault("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

from apps.api.src.main import app
from apps.api.src.services.voice_service import TranscriptionResult


@pytest.mark.asyncio
async def test_create_transcription_success(monkeypatch):
    """Uploading valid audio returns transcription payload."""

    async def fake_transcribe(audio_stream, user_id=None):  # noqa: ANN001
        yield TranscriptionResult(
            text="Xin chào",
            is_final=True,
            confidence=0.96,
            alternatives=[{"text": "Xin chao", "confidence": 0.7}],
        )

    monkeypatch.setattr(
        "apps.api.src.services.voice_service.voice_service.transcribe_audio_stream",
        fake_transcribe,
    )

    audio_bytes = (b"\x00\x01" * 16000)  # 1 second of dummy PCM16 audio

    files = {
        "audio_file": ("sample.wav", audio_bytes, "audio/wav"),
    }

    headers = {
        "x-user-id": str(uuid4()),
        "x-request-id": "test-request",
    }

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/voice/transcriptions",
            files=files,
            headers=headers,
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["text"] == "Xin chào"
    assert payload["confidence"] == pytest.approx(0.96)
    assert payload["alternatives"][0]["text"] == "Xin chao"
    assert payload["duration_ms"] > 0


@pytest.mark.asyncio
async def test_create_transcription_empty_audio(monkeypatch):
    """Empty audio payload returns validation error."""

    async def fake_transcribe(audio_stream, user_id=None):  # noqa: ANN001
        yield TranscriptionResult(text="", is_final=True, confidence=0.0)

    monkeypatch.setattr(
        "apps.api.src.services.voice_service.voice_service.transcribe_audio_stream",
        fake_transcribe,
    )

    files = {
        "audio_file": ("empty.wav", b"", "audio/wav"),
    }

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/v1/voice/transcriptions", files=files)

    payload = response.json()
    assert response.status_code == 400, payload
    assert payload["error"]["error_code"] == "EMPTY_AUDIO"


@pytest.mark.asyncio
async def test_create_transcription_unsupported_media():
    """Unsupported content type returns 415."""

    files = {
        "audio_file": ("sample.txt", b"hello", "text/plain"),
    }

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/v1/voice/transcriptions", files=files)

    assert response.status_code == 415
    payload = response.json()
    assert payload["error"]["error_code"] == "UNSUPPORTED_MEDIA_TYPE"
