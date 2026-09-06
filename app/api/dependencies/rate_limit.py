"""Rate limiting dependency using Redis."""

import logging
from fastapi import Request, HTTPException, status
import redis.asyncio as aioredis

from app.config import get_settings

logger = logging.getLogger(__name__)

redis_client: aioredis.Redis | None = None


async def init_redis():
    """Initialize Redis connection pool."""
    global redis_client
    settings = get_settings()
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=1.0,
            socket_timeout=1.0,
        )
        # Quick ping to test connection
        await redis_client.ping()
        logger.info("Redis initialized for rate limiting.")
    except Exception as e:
        logger.error("Failed to connect to Redis, rate limiting will be disabled. Error: %s", e)
        redis_client = None


async def close_redis():
    """Close Redis connection pool."""
    global redis_client
    if redis_client:
        await redis_client.aclose()


async def rate_limit(request: Request):
    """Rate limit dependency: 60 requests / minute / IP.
    
    Fails open (allows request) if Redis is unavailable.
    """
    global redis_client
    if not redis_client:
        return

    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}"

    try:
        current = await redis_client.get(key)
        if current and int(current) >= 60:
            logger.warning("Rate limit exceeded for IP: %s", client_ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too Many Requests",
            )

        pipe = redis_client.pipeline()
        pipe.incr(key)
        # Set expiration only if the key doesn't have one
        pipe.expire(key, 60, nx=True)
        await pipe.execute()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Redis rate limiting error: %s", e)
        # Fails open on Redis error
