"""Pydantic response schemas for Baltic index endpoints."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BalticIndexResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    index_code: str
    ts: datetime
    value: Decimal
