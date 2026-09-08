"""Tests for the port API endpoints.

The non-DB tests override the database dependency with an in-memory session
so they work without a running PostgreSQL.
"""

from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import *  # noqa: F401,F403

# In-memory SQLite for non-DB tests (no PostgreSQL required)
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=_engine)
_TestSession = sessionmaker(bind=_engine)


def _override_get_db() -> Generator[Session, None, None]:
    session = _TestSession()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)
PREFIX = get_settings().api_v1_prefix


def test_list_ports_returns_200_empty() -> None:
    response = client.get(f"{PREFIX}/ports")

    assert response.status_code == 200
    assert response.json() == []


def test_list_ports_with_east_coast_filter_returns_200() -> None:
    response = client.get(f"{PREFIX}/ports", params={"east_coast_only": True})

    assert response.status_code == 200
    assert response.json() == []


def test_port_weather_for_missing_port_returns_404() -> None:
    response = client.get(f"{PREFIX}/ports/999999/weather")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
