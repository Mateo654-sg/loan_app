import os
from pathlib import Path

# Test environment must be configured BEFORE any app import:
# Settings is instantiated at module import time and cached.
_TEST_DB = "postgresql+psycopg://pocketpal:pocketpal@localhost:5433/pocketpal_test"
os.environ.setdefault("JWT_SECRET", "test-only-secret-do-not-use-in-production-0123456789")
os.environ["DATABASE_URL"] = _TEST_DB

from pathlib import Path as _Path  # noqa: E402

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.engine.url import make_url  # noqa: E402

from app.core.config import Settings  # noqa: E402
from app.main import app  # noqa: E402

_BACKEND_DIR = _Path(__file__).resolve().parent.parent


def _create_test_database_if_missing() -> None:
    url = make_url(_TEST_DB)
    admin_url = url.set(database="pocketpal")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            conn.execute(
                text(f"CREATE DATABASE {url.database}")  # noqa: S608 - fixed internal name
            )
    except Exception:
        pass  # already exists
    finally:
        admin_engine.dispose()


def _run_migrations() -> None:
    alembic_cfg = Config(str(_BACKEND_DIR / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(_BACKEND_DIR / "migrations"))
    alembic_cfg.set_main_option("sqlalchemy.url", _TEST_DB)
    command.upgrade(alembic_cfg, "head")


def _truncate_all_tables() -> None:
    engine = create_engine(_TEST_DB)
    try:
        with engine.connect() as conn:
            tables = conn.execute(
                text(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = 'public' AND tablename <> 'alembic_version'"
                )
            ).scalars()
            names = list(tables)
            if names:
                conn.execute(text(f"TRUNCATE {', '.join(names)} CASCADE"))
            conn.commit()
    finally:
        engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def test_database() -> None:
    _create_test_database_if_missing()
    _run_migrations()
    yield
    _truncate_all_tables()


@pytest.fixture(autouse=True)
def clean_database(test_database) -> None:  # noqa: ARG001
    yield
    _truncate_all_tables()


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Rate limiting is per-process/per-IP; tests share both, so every
    test starts with a clean window."""
    from app.main import app as fastapi_app

    limiter = getattr(fastapi_app.state, "rate_limiter", None)
    if limiter is not None:
        limiter.reset()
    yield
    if limiter is not None:
        limiter.reset()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def settings() -> Settings:
    return Settings(_env_file=None)
