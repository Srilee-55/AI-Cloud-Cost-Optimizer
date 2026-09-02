import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Cloud Cost Optimizer"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (PostgreSQL / Supabase)
    DATABASE_URL: str = "sqlite:///./cloud_optimizer.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 300
    DB_POOL_PRE_PING: bool = True

    # Supabase Credentials
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # JWT & Authentication
    JWT_SECRET: str = ""
    SECRET_KEY: str = "dev-super-secret-key-change-in-production-2026-optimizer"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Currency Configuration (Default: Indian Rupee INR)
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"
    USD_TO_INR_EXCHANGE_RATE: float = 83.50

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
    ]

    @property
    def EFFECTIVE_SECRET_KEY(self) -> str:
        return self.JWT_SECRET if self.JWT_SECRET and len(self.JWT_SECRET.strip()) > 0 else self.SECRET_KEY

    @property
    def NORMALIZED_DATABASE_URL(self) -> str:
        url = self.DATABASE_URL.strip()
        # Handle Supabase postgres:// -> postgresql:// for SQLAlchemy
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
