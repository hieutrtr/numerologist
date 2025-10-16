"""Application configuration and environment settings."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Numeroly API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True

    # Server
    api_prefix: str = "/v1"
    api_title: str = "Numeroly Vietnamese AI Voicebot API"
    api_description: str = "REST API for Numeroly voice-based numerology application"

    # Database
    database_url: str = "postgresql+asyncpg://numeroly:password@localhost:5432/numeroly"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # Azure OpenAI Configuration
    azure_openai_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_version: str = "2025-01-01-preview"
    
    # Azure OpenAI - Speech-to-Text (STT)
    # Using gpt-4o-mini-transcribe: 12x cheaper than Azure Speech Services, 54% better accuracy
    # Availability: eastus2 region (public preview 2025)
    azure_openai_stt_deployment_name: str = "gpt-4o-mini-transcribe"
    
    # Azure OpenAI - Reasoning & Agent Logic
    # Using gpt-4o-mini for numerology calculations and conversation
    azure_openai_reasoning_deployment_name: str = "gpt-4o-mini"

    # External APIs
    # ElevenLabs - Text-to-Speech (Vietnamese voice synthesis)
    elevenlabs_api_key: Optional[str] = None
    elevenlabs_voice_id: str = "default"

    # Logging
    log_level: str = "INFO"

    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = False


def get_settings() -> Settings:
    """Get application settings instance."""
    return Settings()


settings = get_settings()
