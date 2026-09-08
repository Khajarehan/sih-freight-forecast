from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "SIH Freight Forecasting API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/freight"
    timescale_enabled: bool = False

    cors_origins: str = "http://localhost:3000"
    backend_cors_origins: str = ""

    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle: int = 1800

    @property
    def cors_origin_list(self) -> list[str]:
        raw = f"{self.cors_origins},{self.backend_cors_origins}"
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
        return origins if origins else ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
