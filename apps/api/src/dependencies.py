"""FastAPI dependency injection providers."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from .utils.database import AsyncSessionLocal
from .config import settings


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session for dependency injection."""
    async with AsyncSessionLocal() as session:
        yield session


async def get_settings():
    """Get application settings for dependency injection."""
    return settings
