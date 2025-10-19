"""Pydantic schemas for voice transcription endpoints."""

from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptionAlternative(BaseModel):
    """Represents an alternative transcription candidate."""

    text: str = Field(..., description="Alternative transcription text")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )


class TranscriptionResponse(BaseModel):
    """Response payload for a transcription request."""

    text: str = Field(..., description="Final transcription text")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score for the transcript"
    )
    alternatives: List[TranscriptionAlternative] = Field(
        default_factory=list, description="Alternative transcription suggestions"
    )
    duration_ms: Optional[float] = Field(
        None,
        description="Approximate duration of the processed audio in milliseconds",
        ge=0.0,
    )


class TranscriptionError(BaseModel):
    """Standardized error response for transcription failures."""

    error_code: str = Field(..., description="Machine readable error code")
    message: str = Field(..., description="Human readable Vietnamese error message")
    request_id: Optional[str] = Field(
        default=None, description="Identifier for correlating logs"
    )


class TranscriptionErrorResponse(BaseModel):
    """Wrapper payload for error responses."""

    error: TranscriptionError
