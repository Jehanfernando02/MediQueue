from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    # In production, don't use env_file - rely on actual environment variables
    # In development, use .env.dev if it exists
    model_config = SettingsConfigDict(
        env_file=".env.dev" if os.path.exists(".env.dev") else None,
        env_file_encoding="utf-8"
    )

    # App
    APP_NAME: str = "MediQueue"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://mediqueue:mediqueue@localhost:5432/mediqueue"

    # Redis (optional — only needed if using caching/Celery)
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_OPENSSL_RAND"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — Comma-separated origins (stored as string, parsed on demand)
    ALLOWED_ORIGINS: str = "http://localhost:8080,http://localhost:8081,http://localhost:8082"

    # Rate limiting
    RATE_LIMIT_BOOKING_PER_MINUTE: int = 5

    def get_allowed_origins_list(self) -> list[str]:
        """Get ALLOWED_ORIGINS as a list by splitting comma-separated string"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
