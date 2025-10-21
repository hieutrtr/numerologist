"""Redis client factory and dependency injection."""

import redis.asyncio
from typing import Optional

from ..config import settings

_redis_client: Optional[redis.asyncio.Redis] = None


async def init_redis() -> redis.asyncio.Redis:
    """Initialize and return Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.asyncio.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None


async def get_redis_client() -> Optional[redis.asyncio.Redis]:
    """Dependency injection function for FastAPI."""
    return await init_redis()
