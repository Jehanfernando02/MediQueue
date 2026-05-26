import time
import logging
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import app.redis_client
from app.redis_client import redis_client
from app.utils.response import error_response

logger = logging.getLogger("mediqueue.rate_limit")

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only rate limit mutating requests on core endpoints (e.g. appointments)
        if request.method == "POST" and "/api/v1/appointments" in request.url.path:
            # Check if Redis is globally marked as unavailable
            if not app.redis_client.redis_available:
                return await call_next(request)

            # Get user ID or IP
            user = getattr(request.state, "user", None)
            identifier = str(user.id) if user else request.client.host
            
            key = f"rate_limit:appointments:{identifier}"
            
            # Redis sliding window using ZSET
            now = time.time()
            window = 60  # 1 minute
            limit = 5    # 5 requests per minute
            
            try:
                async with redis_client.pipeline(transaction=True) as pipe:
                    # Remove old timestamps
                    pipe.zremrangebyscore(key, 0, now - window)
                    # Count remaining
                    pipe.zcard(key)
                    # Add new timestamp
                    pipe.zadd(key, {str(now): now})
                    # Set expiry on the key
                    pipe.expire(key, window)
                    
                    results = await pipe.execute()
                    
                current_count = results[1]
                
                if current_count >= limit:
                    return error_response(
                        message="Too many appointment requests. Please wait a minute.",
                        status_code=429,
                        error_code="RATE_LIMIT_EXCEEDED"
                    )
            except Exception as e:
                logger.warning(f"Redis rate limiting failed: {e}. Bypassing rate limit and disabling Redis.")
                app.redis_client.redis_available = False

        return await call_next(request)
