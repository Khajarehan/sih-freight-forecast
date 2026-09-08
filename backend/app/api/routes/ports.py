"""Port listing and port-level data endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Port, PortWeatherObservation
from app.schemas.ports import PortResponse
from app.schemas.weather import WeatherObservationResponse

router = APIRouter(tags=["ports"])


@router.get("/ports", response_model=list[PortResponse])
def list_ports(
    east_coast_only: bool = Query(False, description="Return only East Coast India ports"),
    db: Session = Depends(get_db),
) -> list[PortResponse]:
    statement = select(Port).order_by(Port.name)
    if east_coast_only:
        statement = statement.where(Port.is_east_coast_india.is_(True))
    ports = db.execute(statement).scalars().all()
    return [PortResponse.model_validate(port) for port in ports]


@router.get("/ports/{port_id}/weather", response_model=list[WeatherObservationResponse])
def get_port_weather(
    port_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[WeatherObservationResponse]:
    port = db.get(Port, port_id)
    if port is None:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")
    statement = (
        select(PortWeatherObservation)
        .where(PortWeatherObservation.port_id == port_id)
        .order_by(PortWeatherObservation.ts.desc())
        .limit(limit)
    )
    observations = db.execute(statement).scalars().all()
    return [WeatherObservationResponse.model_validate(obs) for obs in observations]
