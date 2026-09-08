"""Forecast run endpoints: create and retrieve forecasts."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ForecastPoint, ForecastRun, Route, VesselType
from app.schemas.forecasts import ForecastPointResponse, ForecastRequest, ForecastRunResponse
from app.services.forecast.engine import InsufficientDataError, run_forecast

router = APIRouter(tags=["forecasts"])


@router.post("/forecasts", response_model=ForecastRunResponse, status_code=201)
def create_forecast(body: ForecastRequest, db: Session = Depends(get_db)) -> ForecastRunResponse:
    # Validate foreign keys
    if db.get(Route, body.route_id) is None:
        raise HTTPException(status_code=404, detail=f"Route {body.route_id} not found")
    if db.get(VesselType, body.vessel_type_id) is None:
        raise HTTPException(status_code=404, detail=f"Vessel type {body.vessel_type_id} not found")

    try:
        forecast_run = run_forecast(
            db,
            route_id=body.route_id,
            vessel_type_id=body.vessel_type_id,
            horizon_days=body.horizon_days,
        )
        db.commit()
    except InsufficientDataError as error:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from error

    return _build_response(db, forecast_run)


@router.get("/forecasts/{forecast_id}", response_model=ForecastRunResponse)
def get_forecast(forecast_id: int, db: Session = Depends(get_db)) -> ForecastRunResponse:
    forecast_run = db.get(ForecastRun, forecast_id)
    if forecast_run is None:
        raise HTTPException(status_code=404, detail=f"Forecast run {forecast_id} not found")
    return _build_response(db, forecast_run)


def _build_response(db: Session, forecast_run: ForecastRun) -> ForecastRunResponse:
    points = (
        db.execute(
            select(ForecastPoint)
            .where(ForecastPoint.forecast_run_id == forecast_run.id)
            .order_by(ForecastPoint.target_ts)
        )
        .scalars()
        .all()
    )
    return ForecastRunResponse(
        id=forecast_run.id,
        route_id=forecast_run.route_id,
        vessel_type_id=forecast_run.vessel_type_id,
        model_name=forecast_run.model_name,
        model_version=forecast_run.model_version,
        status=forecast_run.status.value,
        requested_at=forecast_run.requested_at,
        completed_at=forecast_run.completed_at,
        points=[ForecastPointResponse.model_validate(point) for point in points],
    )
