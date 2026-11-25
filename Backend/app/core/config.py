import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniDoc-AI Document Intelligence"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    PROCESSED_DIR: Path = STORAGE_DIR / "processed"
    
    # Database (PostgreSQL on local machine port 5433)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:soykot@localhost:5433/omnidoc_ai"
    )
    
    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "gemini" or "openai" or "mock"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = "gemini-1.5-flash"
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_PAGES_DIGITAL_PARSE: int = 2000
    OCR_PAGE_LIMIT_PER_BATCH: int = 50
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
