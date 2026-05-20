from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.dev", env_file_encoding="utf-8")

    # App
    APP_NAME: str = "MediQueue"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://mediqueue:mediqueue@localhost:5432/mediqueue"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_OPENSSL_RAND"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — Comma-separated origins in env, parsed as list
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
        description="Comma-separated CORS origins"
    )

    # Rate limiting
    RATE_LIMIT_BOOKING_PER_MINUTE: int = 5

    def __init__(self, **data):
        super().__init__(**data)
        # Parse ALLOWED_ORIGINS if it comes as a string (from env vars)
        if isinstance(self.ALLOWED_ORIGINS, str):
            self.ALLOWED_ORIGINS = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
