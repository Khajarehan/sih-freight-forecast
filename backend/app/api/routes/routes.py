"""Route listing and freight rate time-series endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import Route, RouteFreightRate
from app.schemas.routes import FreightRateResponse, RouteResponse

router = APIRouter(tags=["routes"])


@router.get("/routes", response_model=list[RouteResponse])
def list_routes(db: Session = Depends(get_db)) -> list[RouteResponse]:
    statement = (
        select(Route)
        .options(joinedload(Route.origin_port), joinedload(Route.destination_port))
        .order_by(Route.id)
    )
    routes = db.execute(statement).unique().scalars().all()
    return [RouteResponse.model_validate(route) for route in routes]


@router.get("/routes/{route_id}/rates", response_model=list[FreightRateResponse])
def get_route_rates(
    route_id: int,
    vessel_type_code: str | None = Query(default=None, description="Filter by vessel type code"),
    limit: int = Query(default=500, ge=1, le=5000),
    db: Session = Depends(get_db),
) -> list[FreightRateResponse]:
    route = db.get(Route, route_id)
    if route is None:
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found")
    statement = (
        select(RouteFreightRate)
        .where(RouteFreightRate.route_id == route_id)
        .order_by(RouteFreightRate.ts.desc())
        .limit(limit)
    )
    if vessel_type_code is not None:
        from app.models import VesselType

        vessel_type = db.execute(
            select(VesselType).where(VesselType.code == vessel_type_code)
        ).scalar_one_or_none()
        if vessel_type is None:
            raise HTTPException(status_code=404, detail=f"Vessel type '{vessel_type_code}' not found")
        statement = statement.where(RouteFreightRate.vessel_type_id == vessel_type.id)
    rates = db.execute(statement).scalars().all()
    return [
        FreightRateResponse(
            route_id=rate.route_id,
            vessel_type_id=rate.vessel_type_id,
            rate_basis=rate.rate_basis.value,
            ts=rate.ts,
            rate_value=rate.rate_value,
        )
        for rate in rates
    ]
