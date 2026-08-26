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

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def database_url_sync(self) -> str:
        """Sync database URL for Alembic migrations."""
        return self.DATABASE_URL.replace("+asyncpg", "+psycopg2")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
