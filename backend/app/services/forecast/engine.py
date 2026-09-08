"""MVP freight rate forecasting engine.

Uses a simple linear-trend extrapolation on the stored route_freight_rate
time-series.  This is a placeholder baseline — it is not a production-quality
model, but it exercises the full forecast pipeline (query historical data,
generate predictions, write forecast_run + forecast_point).
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ForecastPoint, ForecastRun, RouteFreightRate, RunStatus
from app.models.enums import RateBasis


MODEL_NAME = "linear_trend_v0"
MODEL_VERSION = "0.1.0"


class InsufficientDataError(Exception):
    """Raised when there is not enough historical data to produce a forecast."""


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def run_forecast(
    session: Session,
    *,
    route_id: int,
    vessel_type_id: int,
    horizon_days: int = 30,
    charter_enquiry_id: int | None = None,
) -> ForecastRun:
    """Produce a freight-rate forecast and persist the results.

    Returns the completed ForecastRun (with related ForecastPoints flushed
    to the session but not committed — the caller owns the transaction).
    """
    forecast_run = ForecastRun(
        route_id=route_id,
        vessel_type_id=vessel_type_id,
        charter_enquiry_id=charter_enquiry_id,
        model_name=MODEL_NAME,
        model_version=MODEL_VERSION,
        status=RunStatus.RUNNING,
        requested_at=_utcnow(),
    )
    session.add(forecast_run)
    session.flush()  # assigns forecast_run.id

    try:
        points = _generate_forecast(session, forecast_run, horizon_days)
        for point in points:
            session.add(point)
        session.flush()

        forecast_run.status = RunStatus.SUCCEEDED
        forecast_run.completed_at = _utcnow()
    except Exception as error:
        forecast_run.status = RunStatus.FAILED
        forecast_run.completed_at = _utcnow()
        forecast_run.artifact_uri = str(error)[:512]
        session.flush()
        raise

    return forecast_run


def _generate_forecast(
    session: Session,
    forecast_run: ForecastRun,
    horizon_days: int,
) -> list[ForecastPoint]:
    """Build forecast points using linear trend extrapolation."""

    # Fetch historical rates for the target route and vessel type
    statement = (
        select(RouteFreightRate)
        .where(
            RouteFreightRate.route_id == forecast_run.route_id,
            RouteFreightRate.vessel_type_id == forecast_run.vessel_type_id,
            RouteFreightRate.rate_basis == RateBasis.VOYAGE_USD_PER_TONNE,
        )
        .order_by(RouteFreightRate.ts.asc())
    )
    rates = session.execute(statement).scalars().all()

    if len(rates) < 2:
        raise InsufficientDataError(
            f"Need at least 2 historical observations for route={forecast_run.route_id}, "
            f"vessel_type={forecast_run.vessel_type_id}; found {len(rates)}"
        )

    # Build numpy arrays: x = days since first observation, y = rate values
    first_ts = rates[0].ts
    x = np.array([(rate.ts - first_ts).total_seconds() / 86400.0 for rate in rates])
    y = np.array([float(rate.rate_value) for rate in rates])

    # Fit linear regression via numpy (degree-1 polynomial)
    coefficients = np.polyfit(x, y, deg=1)
    slope, intercept = coefficients[0], coefficients[1]

    # Compute residuals for prediction interval estimation
    y_fitted = np.polyval(coefficients, x)
    residuals = y - y_fitted
    residual_std = float(np.std(residuals)) if len(residuals) > 2 else 0.0

    # Generate forecast points
    last_ts = rates[-1].ts
    last_day = float((last_ts - first_ts).total_seconds() / 86400.0)

    points: list[ForecastPoint] = []
    for day_offset in range(1, horizon_days + 1):
        target_ts = last_ts + timedelta(days=day_offset)
        future_x = last_day + day_offset
        predicted = slope * future_x + intercept

        # Ensure predicted value is non-negative
        predicted = max(predicted, 0.0)

        # Prediction intervals: p10, p50, p90
        p10 = max(predicted - 1.28 * residual_std, 0.0)
        p50 = predicted
        p90 = predicted + 1.28 * residual_std

        points.append(
            ForecastPoint(
                forecast_run_id=forecast_run.id,
                target_ts=target_ts,
                predicted_value=Decimal(str(round(predicted, 4))),
                p10=Decimal(str(round(p10, 4))),
                p50=Decimal(str(round(p50, 4))),
                p90=Decimal(str(round(p90, 4))),
            )
        )

    return points
