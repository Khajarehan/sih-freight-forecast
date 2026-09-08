"""Tests for the forecast API endpoints."""

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


def test_create_forecast_with_missing_route_returns_404() -> None:
    response = client.post(
        f"{PREFIX}/forecasts",
        json={"route_id": 999999, "vessel_type_id": 1, "horizon_days": 7},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_forecast_for_missing_id_returns_404() -> None:
    response = client.get(f"{PREFIX}/forecasts/999999")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_forecast_validates_horizon_bounds() -> None:
    response = client.post(
        f"{PREFIX}/forecasts",
        json={"route_id": 1, "vessel_type_id": 1, "horizon_days": 0},
    )

    assert response.status_code == 422  # Pydantic validation error


def test_create_forecast_validates_horizon_upper_bound() -> None:
    response = client.post(
        f"{PREFIX}/forecasts",
        json={"route_id": 1, "vessel_type_id": 1, "horizon_days": 400},
    )

    assert response.status_code == 422


def test_create_forecast_requires_route_and_vessel_type() -> None:
    response = client.post(f"{PREFIX}/forecasts", json={})

    assert response.status_code == 422
