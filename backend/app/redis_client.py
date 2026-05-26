import redis.asyncio as aioredis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Try to create Redis client, but allow it to fail gracefully
redis_client: aioredis.Redis | None = None
redis_available = False

try:
    redis_client = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
    redis_available = True
except Exception as e:
    logger.warning(f"Redis not available: {e}. Running without caching.")
    redis_available = False


async def get_redis() -> aioredis.Redis | None:
    """Get Redis client if available, otherwise return None."""
    global redis_available
    if not redis_available or redis_client is None:
        return None
    try:
        # Test connection
        await redis_client.ping()
        return redis_client
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Disabling Redis caching/rate-limiting.")
        redis_available = False
        return None
