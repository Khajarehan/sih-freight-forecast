"""Integration tests for the OR-Tools optimization API endpoint."""

from datetime import date, timedelta
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Route  # noqa: F401,F403
from app.services.ingestion.synthetic import seed_synthetic_dataset

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=_engine)


@pytest.fixture(autouse=True)
def override_db() -> Generator[Session, None, None]:
    connection = _engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    prev_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = lambda: session
    yield session
    session.close()
    transaction.rollback()
    connection.close()
    if prev_override is not None:
        app.dependency_overrides[get_db] = prev_override
    else:
        app.dependency_overrides.pop(get_db, None)


client = TestClient(app)
PREFIX = get_settings().api_v1_prefix


def test_optimize_api_missing_route_returns_404() -> None:
    response = client.post(
        f"{PREFIX}/optimize",
        json={
            "route_id": 999999,
            "cargo_quantity_t": 50000,
            "laycan_start": str(date.today()),
            "laycan_end": str(date.today() + timedelta(days=5)),
        },
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_optimize_api_invalid_laycan_dates_returns_422() -> None:
    response = client.post(
        f"{PREFIX}/optimize",
        json={
            "route_id": 1,
            "cargo_quantity_t": 50000,
            "laycan_start": str(date.today() + timedelta(days=10)),
            "laycan_end": str(date.today()),
        },
    )

    assert response.status_code == 422
    assert "cannot be before" in response.json()["detail"].lower()


def test_optimize_api_successful_execution(override_db: Session) -> None:
    # Seed data into isolated transaction DB session
    seed_synthetic_dataset(override_db, days=30)
    override_db.flush()

    route = override_db.query(Route).first()
    assert route is not None
    route_id = route.id

    response = client.post(
        f"{PREFIX}/optimize",
        json={
            "route_id": route_id,
            "cargo_quantity_t": 55000,
            "laycan_start": str(date.today()),
            "laycan_end": str(date.today() + timedelta(days=7)),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("OPTIMAL", "INFEASIBLE")
    assert "evaluated_candidates" in data
    assert isinstance(data["evaluated_candidates"], list)
