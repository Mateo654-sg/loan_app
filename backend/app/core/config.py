from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PocketPal API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://pocketpal:pocketpal@localhost:5433/pocketpal"

    # Security configuration is centralized here (SECURITY.md §61).
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # Auth endpoint throttling (SECURITY.md §26-27). Per-IP sliding window.
    rate_limit_login_per_minute: int = 10
    rate_limit_register_per_minute: int = 5
    rate_limit_refresh_per_minute: int = 30

    # Restricted CORS (SECURITY.md §17): comma-separated origins. Empty means
    # no cross-origin browser access is allowed at all; native apps do not
    # need CORS. Never ship "*" for authenticated traffic.
    cors_origins: str = ""

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if self.is_production and len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters in production")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
