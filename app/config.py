"""NFC Review Platform — Configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://nfc_user:nfc_password@db:5432/nfc_db"

    # Public base URL for NFC/QR URL generation
    PUBLIC_BASE_URL: str = "https://tap.example.com"

    # Security
    API_KEY: str | None = None  # None disables management endpoints if not set
    SECRET_KEY: str = "super-secret-default-key-change-in-prod"

    # Redis (Rate limiting)
    REDIS_URL: str = "redis://redis:6379/0"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Shipping & Tracking
    POST_TRACKING_BASE_URL: str = "https://tracking.post.ir/?traking_code="

    # SMS & Notifications
    SMS_PROVIDER: str = "mock"
    SMS_API_KEY: str | None = None
    SMS_SENDER: str | None = None
    SMS_TEMPLATE_ID: str | None = None

    @property
    def database_url_sync(self) -> str:
        """Sync database URL for Alembic migrations."""
        return self.DATABASE_URL.replace("+asyncpg", "+psycopg2")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
