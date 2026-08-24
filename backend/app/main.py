from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, categories, clients, collections, dashboard, finance, goals, health, loans, payments, transactions
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.security_middleware import register_security_middleware


def create_app() -> FastAPI:
    # Resolved per-call so tests/ops can rebuild the app after env changes.
    settings = get_settings()
    configure_logging()

    app = FastAPI(
        title=settings.app_name,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
    )

    register_exception_handlers(app)
    register_security_middleware(app, settings)

    # Restricted CORS (SECURITY.md §17): only explicitly configured origins.
    origins = settings.cors_origin_list
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
            allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
        )

    app.include_router(health.router, prefix=settings.api_v1_prefix)
    app.include_router(auth.router, prefix=settings.api_v1_prefix)
    app.include_router(categories.router, prefix=settings.api_v1_prefix)
    app.include_router(transactions.router, prefix=settings.api_v1_prefix)
    app.include_router(finance.router, prefix=settings.api_v1_prefix)
    app.include_router(goals.router, prefix=settings.api_v1_prefix)
    app.include_router(clients.router, prefix=settings.api_v1_prefix)
    app.include_router(loans.router, prefix=settings.api_v1_prefix)
    app.include_router(payments.router, prefix=settings.api_v1_prefix)
    app.include_router(collections.router, prefix=settings.api_v1_prefix)
    app.include_router(dashboard.router, prefix=settings.api_v1_prefix)

    return app


app = create_app()
