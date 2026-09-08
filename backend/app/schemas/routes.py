"""Pydantic response schemas for route and freight rate endpoints."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class RoutePortSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unlocode: str
    name: str
    country: str


class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    origin_port_id: int
    destination_port_id: int
    distance_nm: Decimal | None = None
    origin_port: RoutePortSummary
    destination_port: RoutePortSummary


class FreightRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    route_id: int
    vessel_type_id: int
    rate_basis: str
    ts: datetime
    rate_value: Decimal
