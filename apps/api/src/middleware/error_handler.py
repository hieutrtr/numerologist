"""Global error handling middleware."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uuid
from datetime import datetime
from typing import Any

from ..utils.logger import get_logger

logger = get_logger(__name__)


async def api_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all API exceptions with consistent error format."""
    request_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    logger.error(
        "API error",
        extra={
            "request_id": request_id,
            "error": str(exc),
            "path": request.url.path,
        },
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "timestamp": timestamp,
                "requestId": request_id,
            }
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle validation errors."""
    request_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    errors = exc.errors()
    first_error = errors[0] if errors else {}

    logger.warning(
        "Validation error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "errors": errors,
        },
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "details": {
                    "field": ".".join(str(loc) for loc in first_error.get("loc", [])),
                    "reason": first_error.get("msg", "Unknown error"),
                },
                "timestamp": timestamp,
                "requestId": request_id,
            }
        },
    )


def setup_error_handlers(app: FastAPI) -> None:
    """Register error handlers with FastAPI app."""
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, api_exception_handler)
