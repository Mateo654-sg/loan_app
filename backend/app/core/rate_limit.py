"""Per-IP sliding-window rate limiter for sensitive endpoints
(SECURITY.md §26-27: centralized, configurable, must not block normal use).

In-memory implementation appropriate for the v1.0 single-process
deployment. Horizontal scaling would require a shared store (e.g. Redis);
documented as a known limitation rather than silently under-protecting a
multi-instance deployment.
"""
import threading
from collections import defaultdict, deque
from time import monotonic


class RateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, limit_per_minute: int) -> bool:
        """Return True when allowed; records the attempt either way."""
        now = monotonic()
        window_start = now - 60.0

        with self._lock:
            bucket = self._events[key]
            while bucket and bucket[0] < window_start:
                bucket.popleft()

            if len(bucket) >= limit_per_minute:
                return False

            bucket.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


__all__ = ["RateLimiter"]
