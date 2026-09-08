"""Pydantic request/response schemas for forecast endpoints."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ForecastRequest(BaseModel):
    """Request body for creating a new forecast run."""

    route_id: int
    vessel_type_id: int
    horizon_days: int = Field(default=30, ge=1, le=365)


class ForecastPointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    target_ts: datetime
    predicted_value: Decimal
    p10: Decimal | None = None
    p50: Decimal | None = None
    p90: Decimal | None = None


class ForecastRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    route_id: int
    vessel_type_id: int
    model_name: str
    model_version: str
    status: str
    requested_at: datetime
    completed_at: datetime | None = None
    points: list[ForecastPointResponse] = []
