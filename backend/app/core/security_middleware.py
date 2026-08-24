from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.config import Settings, get_settings
from app.core.errors import _error_payload
from app.core.logging import get_logger
from app.core.rate_limit import RateLimiter

logger = get_logger("pocketpal.security")

# (method, path-suffix) -> settings attribute with the per-minute limit.
_PROTECTED_ROUTES: dict[tuple[str, str], str] = {
    ("POST", "/auth/login"): "rate_limit_login_per_minute",
    ("POST", "/auth/register"): "rate_limit_register_per_minute",
    ("POST", "/auth/refresh"): "rate_limit_refresh_per_minute",
}


def register_security_middleware(app: FastAPI, settings: Settings | None = None) -> None:
    """Security headers + auth-endpoint throttling in one middleware.

    Headers follow the applicable subset of SECURITY.md §58 for a JSON API;
    HSTS is only sent in production where TLS terminates in front of us.
    """
    resolved_settings = settings or get_settings()
    limiter = RateLimiter()
    app.state.rate_limiter = limiter  # exposed for tests/ops

    @app.middleware("http")
    async def security_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        # ---- rate limiting ----
        route_key = (request.method, request.url.path)
        limit_attr = None
        for (method, suffix), attr in _PROTECTED_ROUTES.items():
            if request.method == method and request.url.path.endswith(suffix):
                limit_attr = attr
                break

        if limit_attr is not None:
            client_ip = request.client.host if request.client else "unknown"
            allowed = limiter.check(
                f"{client_ip}:{limit_attr}",
                getattr(resolved_settings, limit_attr),
            )
            if not allowed:
                logger.warning(
                    "rate_limit_blocked ip=%s endpoint=%s", client_ip, limit_attr
                )
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content=_error_payload(
                        code="RATE_LIMITED",
                        message="Too many attempts. Please wait a minute and try again.",
                        details=[],
                    ),
                    headers={"Retry-After": "60"},
                )

        response = await call_next(request)

        # ---- security headers ----
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        if resolved_settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=63072000; includeSubDomains"
            )
        return response


__all__ = ["register_security_middleware"]
