"""FastAPI dependency injection providers."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from .utils.database import get_async_session
from .config import settings


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session for dependency injection."""
    async with get_async_session() as session:
        yield session


async def get_settings():
    """Get application settings for dependency injection."""
    return settings
