from datetime import datetime

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def _base(**overrides) -> dict:  # type: ignore[no-untyped-def]
    return {
        "jwt_secret": "unit-test-secret-value-that-is-long-enough-0123456789",
        **overrides,
    }


def test_settings_defaults_to_development_environment() -> None:
    settings = Settings(**_base(_env_file=None))

    assert settings.environment == "development"
    assert settings.is_production is False
    assert settings.access_token_expire_minutes == 30
    assert settings.refresh_token_expire_days == 30


def test_production_environment_disables_docs() -> None:
    settings = Settings(**_base(environment="production", _env_file=None))
    assert settings.is_production


def test_jwt_secret_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_production_rejects_short_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(
            environment="production",
            jwt_secret="too-short",
            _env_file=None,
        )


def test_api_v1_prefix_is_versioned() -> None:
    settings = Settings(**_base(_env_file=None))
    assert settings.api_v1_prefix == "/api/v1"
