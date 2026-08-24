import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

# In-memory token bucket rate limiter
REQUEST_LIMITS = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 120


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exempt health and static docs
        path = request.url.path
        if path.startswith("/api/health") or path.startswith("/docs") or path.startswith("/openapi.json"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        current_time = time.time()
        
        # Filter timestamps within last 60 seconds
        request_times = [t for t in REQUEST_LIMITS[client_ip] if current_time - t < 60]
        REQUEST_LIMITS[client_ip] = request_times

        if len(request_times) >= MAX_REQUESTS_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )

        REQUEST_LIMITS[client_ip].append(current_time)
        response = await call_next(request)
        return response
