"""Pydantic response schemas for port endpoints."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PortResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unlocode: str
    name: str
    country: str
    latitude: Decimal
    longitude: Decimal
    max_loa_m: Decimal | None = None
    max_beam_m: Decimal | None = None
    max_draft_m: Decimal | None = None
    cargo_handling_rate_tph: Decimal | None = None
    is_east_coast_india: bool
