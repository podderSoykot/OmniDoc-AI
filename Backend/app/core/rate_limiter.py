import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status

class SimpleRateLimiter:
    """
    Sliding-window in-memory rate limiter per IP address.
    """
    def __init__(self, requests_per_minute: int = 15):
        self.rpm = requests_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check_rate_limit(self, request: Request, identifier: str = None) -> None:
        client_ip = identifier or request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60.0

        # Purge timestamps older than 60s
        self.requests[client_ip] = [ts for ts in self.requests[client_ip] if ts > window_start]

        if len(self.requests[client_ip]) >= self.rpm:
            retry_after = int(60 - (now - self.requests[client_ip][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {max(1, retry_after)} seconds.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        self.requests[client_ip].append(now)

auth_rate_limiter = SimpleRateLimiter(requests_per_minute=20)
api_rate_limiter = SimpleRateLimiter(requests_per_minute=120)
