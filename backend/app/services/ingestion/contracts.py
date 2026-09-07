"""Typed input contracts for external data sources.

These models describe the *raw* shape accepted from a source adapter. They carry
only validation that the existing schema and domain justify; mapping to database
models happens in `normalizers`.
"""

import enum
from decimal import Decimal
from typing import Annotated

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints

from app.models.enums import RateBasis

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Unlocode = Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, min_length=5, max_length=5)]
Imo = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^\d{7}$")]
Latitude = Annotated[Decimal, Field(ge=Decimal("-90"), le=Decimal("90"))]
Longitude = Annotated[Decimal, Field(ge=Decimal("-180"), le=Decimal("180"))]
PositiveDecimal = Annotated[Decimal, Field(gt=Decimal("0"))]
NonNegativeDecimal = Annotated[Decimal, Field(ge=Decimal("0"))]


class BalticIndexCode(enum.Enum):
    BCI = "BCI"
    BPI = "BPI"
    BSI = "BSI"


class RawRecord(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class RawPort(RawRecord):
    """Port master record from a reference source."""

    unlocode: Unlocode
    name: NonEmptyStr
    country: Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, min_length=2, max_length=2)]
    latitude: Latitude
    longitude: Longitude
    max_loa_m: PositiveDecimal | None = None
    max_beam_m: PositiveDecimal | None = None
    max_draft_m: PositiveDecimal | None = None
    cargo_handling_rate_tph: PositiveDecimal | None = None
    is_east_coast_india: bool = False


class RawVesselType(RawRecord):
    """Vessel class reference record."""

    code: NonEmptyStr
    name: NonEmptyStr
    dwt_min_t: Annotated[int, Field(gt=0)] | None = None
    dwt_max_t: Annotated[int, Field(gt=0)] | None = None
    typical_loa_m: PositiveDecimal | None = None
    typical_beam_m: PositiveDecimal | None = None
    typical_draft_m: PositiveDecimal | None = None


class RawRoute(RawRecord):
    """Trade lane between two ports."""

    origin_unlocode: Unlocode
    destination_unlocode: Unlocode
    distance_nm: PositiveDecimal | None = None


class RawVessel(RawRecord):
    """Vessel master identity and dimensions (AIS static data)."""

    imo: Imo
    name: NonEmptyStr | None = None
    vessel_type_code: NonEmptyStr | None = None
    dwt_t: Annotated[int, Field(gt=0)] | None = None
    loa_m: PositiveDecimal | None = None
    beam_m: PositiveDecimal | None = None
    draft_m: PositiveDecimal | None = None


class RawBalticIndexValue(RawRecord):
    """Baltic Exchange index level."""

    index_code: BalticIndexCode
    ts: AwareDatetime
    value: PositiveDecimal


class RawRouteFreightRate(RawRecord):
    """Observed freight rate for a route and vessel type."""

    origin_unlocode: Unlocode
    destination_unlocode: Unlocode
    vessel_type_code: NonEmptyStr
    ts: AwareDatetime
    rate_value: PositiveDecimal
    rate_basis: RateBasis


class RawBunkerPrice(RawRecord):
    """Bunker fuel price at a port."""

    port_unlocode: Unlocode
    fuel_grade: NonEmptyStr = "VLSFO"
    ts: AwareDatetime
    price_usd_per_t: PositiveDecimal


class RawVesselPosition(RawRecord):
    """AIS position report."""

    imo: Imo
    ts: AwareDatetime
    latitude: Latitude
    longitude: Longitude
    sog_kn: NonNegativeDecimal | None = None
    cog_deg: Annotated[Decimal, Field(ge=Decimal("0"), le=Decimal("360"))] | None = None
    nav_status: NonEmptyStr | None = None
    destination_unlocode: Unlocode | None = None


class RawPortWeatherObservation(RawRecord):
    """Weather observation at a port."""

    port_unlocode: Unlocode
    ts: AwareDatetime
    wind_speed_ms: NonNegativeDecimal | None = None
    wave_height_m: NonNegativeDecimal | None = None
    precipitation_mm: NonNegativeDecimal | None = None
    visibility_m: Annotated[int, Field(ge=0)] | None = None


class RawPortTideObservation(RawRecord):
    """Tidal height at a port; heights may legitimately be negative."""

    port_unlocode: Unlocode
    ts: AwareDatetime
    tide_height_m: Decimal
