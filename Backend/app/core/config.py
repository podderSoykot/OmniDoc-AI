import os
import secrets
import warnings
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniDoc-AI Document Intelligence"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    PROCESSED_DIR: Path = STORAGE_DIR / "processed"
    
    # Database (PostgreSQL on local machine port 5433 or SQLite fallback)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:soykot@localhost:5433/omnidoc_ai"
    )
    
    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # 7 days refresh token
    
    # CORS (default to local and Vercel frontend origins, configurable via CORS_ORIGINS)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://omnidoc-frontend-mauve.vercel.app",
    ]
    
    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "gemini" or "openai" or "mock"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = "gemini-1.5-flash"
    
    # Upload limits & Security
    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_PAGES_DIGITAL_PARSE: int = 2000
    OCR_PAGE_LIMIT_PER_BATCH: int = 50
    
    # Background Job & Worker Reliability
    JOB_TIMEOUT_SECONDS: int = 120
    JOB_MAX_RETRIES: int = 3
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )

settings = Settings()

# Parse custom CORS_ORIGINS from env if provided
custom_origins = os.getenv("CORS_ORIGINS")
if custom_origins:
    settings.ALLOWED_ORIGINS = [orig.strip() for orig in custom_origins.split(",") if orig.strip()]

# Enforce non-empty JWT_SECRET with secure generation fallback for local/dev
if not settings.JWT_SECRET:
    env_secret = os.getenv("JWT_SECRET")
    if env_secret:
        settings.JWT_SECRET = env_secret
    else:
        # Generate cryptographically secure ephemeral key and log warning
        settings.JWT_SECRET = secrets.token_urlsafe(32)
        warnings.warn(
            "JWT_SECRET environment variable is not set. A cryptographically random key "
            "has been generated for this session. Set JWT_SECRET in .env for production persistence.",
            UserWarning
        )

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
