"""Tests for the forecast engine (pure logic, no HTTP layer).

Non-DB tests verify the forecast engine's logic using mocked data.
DB-backed tests exercise the full pipeline with real ORM models.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ForecastPoint, ForecastRun, RouteFreightRate, RunStatus
from app.models.enums import RateBasis
from app.services.forecast.engine import InsufficientDataError, run_forecast
from app.services.ingestion.synthetic import seed_synthetic_dataset


def test_insufficient_data_raises(db_session: Session) -> None:
    """A forecast requires at least 2 historical observations."""
    # Seed reference data only (no rates for route_id=1, vessel_type_id=1 combination)
    seed_synthetic_dataset(db_session, days=0)

    # Get actual IDs from the seeded data
    from app.models import Route, VesselType

    route = db_session.execute(select(Route)).scalars().first()
    vessel_type = db_session.execute(select(VesselType)).scalars().first()

    if route is None or vessel_type is None:
        pytest.skip("Reference data not seeded (empty dataset with days=0)")

    with pytest.raises(InsufficientDataError):
        run_forecast(db_session, route_id=route.id, vessel_type_id=vessel_type.id, horizon_days=7)


def test_forecast_produces_expected_number_of_points(db_session: Session) -> None:
    """A successful forecast should produce exactly horizon_days points."""
    seed_synthetic_dataset(db_session, days=30)

    route = db_session.execute(select(RouteFreightRate.route_id)).scalars().first()
    vessel_type_id = db_session.execute(select(RouteFreightRate.vessel_type_id)).scalars().first()

    if route is None or vessel_type_id is None:
        pytest.skip("No freight rate data after seeding")

    horizon = 14
    forecast_run = run_forecast(
        db_session, route_id=route, vessel_type_id=vessel_type_id, horizon_days=horizon
    )

    assert forecast_run.status is RunStatus.SUCCEEDED
    assert forecast_run.completed_at is not None
    assert forecast_run.model_name == "linear_trend_v0"

    points = db_session.execute(
        select(ForecastPoint).where(ForecastPoint.forecast_run_id == forecast_run.id)
    ).scalars().all()

    assert len(points) == horizon


def test_forecast_points_have_confidence_intervals(db_session: Session) -> None:
    """Each forecast point should have p10 <= p50 <= p90."""
    seed_synthetic_dataset(db_session, days=30)

    route_id = db_session.execute(select(RouteFreightRate.route_id)).scalars().first()
    vessel_type_id = db_session.execute(select(RouteFreightRate.vessel_type_id)).scalars().first()

    if route_id is None or vessel_type_id is None:
        pytest.skip("No freight rate data after seeding")

    forecast_run = run_forecast(
        db_session, route_id=route_id, vessel_type_id=vessel_type_id, horizon_days=7
    )

    points = db_session.execute(
        select(ForecastPoint)
        .where(ForecastPoint.forecast_run_id == forecast_run.id)
        .order_by(ForecastPoint.target_ts)
    ).scalars().all()

    for point in points:
        assert point.p10 is not None
        assert point.p50 is not None
        assert point.p90 is not None
        assert point.p10 <= point.p50 <= point.p90
        assert point.predicted_value >= 0


def test_forecast_points_are_future_dates(db_session: Session) -> None:
    """All forecast target_ts values should be after the latest historical observation."""
    seed_synthetic_dataset(db_session, days=10)

    route_id = db_session.execute(select(RouteFreightRate.route_id)).scalars().first()
    vessel_type_id = db_session.execute(select(RouteFreightRate.vessel_type_id)).scalars().first()

    if route_id is None or vessel_type_id is None:
        pytest.skip("No freight rate data after seeding")

    # Find the latest historical observation
    latest_historical = db_session.execute(
        select(RouteFreightRate.ts)
        .where(
            RouteFreightRate.route_id == route_id,
            RouteFreightRate.vessel_type_id == vessel_type_id,
        )
        .order_by(RouteFreightRate.ts.desc())
    ).scalars().first()

    forecast_run = run_forecast(
        db_session, route_id=route_id, vessel_type_id=vessel_type_id, horizon_days=5
    )

    points = db_session.execute(
        select(ForecastPoint).where(ForecastPoint.forecast_run_id == forecast_run.id)
    ).scalars().all()

    for point in points:
        assert point.target_ts > latest_historical
