from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Traffic Incident API"
    environment: str = "local"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = (
        "postgresql+psycopg://traffic:traffic@localhost:5432/traffic_incidents"
    )
    auth_secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 720
    super_admin_email: str = "admin@example.com"
    super_admin_password: str = "admin12345"
    super_admin_name: str = "System Admin"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
