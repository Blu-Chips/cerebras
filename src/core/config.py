from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cerebras Bank Statement Analyzer"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered bank statement analysis using Cerebras and OpenRouter"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # FastAPI backend
    ]
    
    # API Keys
    CEREBRAS_API_KEY: str
    OPENROUTER_API_KEY: str
    STRIPE_SECRET_KEY: str
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Credits
    NEW_USER_CREDITS: int = 1
    CREDIT_PACKAGES = [
        {"amount": 50, "credits": 5, "description": "$0.50 for 5 credits"},
        {"amount": 200, "credits": 25, "description": "$2.00 for 25 credits"},
        {"amount": 500, "credits": 75, "description": "$5.00 for 75 credits"}
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()