from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.db.session import engine
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


def _database_status() -> str:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return "unavailable"
    return "connected"


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.environment,
        database=_database_status(),
    )
