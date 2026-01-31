from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    OPENAI_API_KEY: str
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    SERPAPI_API_KEY: Optional[str] = None
    DATABASE_URL: str = "sqlite:///./applications.db"
    
    # LLM Configuration
    MODEL_NAME: str = "gpt-4o"
    TEMPERATURE: float = 0.0

settings = Settings()
