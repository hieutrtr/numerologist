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

    # Azure
    azure_subscription_id: Optional[str] = None
    azure_tenant_id: Optional[str] = None
    azure_resource_group: Optional[str] = None
    azure_region: str = "southeastasia"

    # Azure Cognitive Services
    azure_speech_key: Optional[str] = None
    azure_speech_region: str = "southeastasia"
    azure_storage_connection_string: Optional[str] = None
    azure_storage_container_name: str = "conversation-audio"

    # External APIs
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    openai_temperature: float = 0.7

    elevenlabs_api_key: Optional[str] = None
    elevenlabs_voice_id: str = "default"

    # Sentry
    sentry_dsn: Optional[str] = None

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
