"""Pydantic response schemas for weather observation endpoints."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class WeatherObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    port_id: int
    ts: datetime
    wind_speed_ms: Decimal | None = None
    wave_height_m: Decimal | None = None
    precipitation_mm: Decimal | None = None
    visibility_m: int | None = None
