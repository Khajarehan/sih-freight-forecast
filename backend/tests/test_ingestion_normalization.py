from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.models.enums import RateBasis
from app.services.ingestion import contracts as c
from app.services.ingestion import normalizers as n
from app.services.ingestion.references import ReferenceResolver, UnknownReferenceError

AWARE_TS = datetime(2026, 1, 1, tzinfo=timezone.utc)
RESOLVER = ReferenceResolver(
    port_ids={"AUNTL": 1, "INPRT": 2},
    vessel_type_ids={"CAPESIZE": 10},
    route_ids={(1, 2): 100},
)


def test_baltic_normalization_maps_enum_and_provenance() -> None:
    raw = c.RawBalticIndexValue(index_code=c.BalticIndexCode.BPI, ts=AWARE_TS, value=Decimal("1500"))

    record = n.normalize_baltic_index_value(raw, ingestion_run_id=7)

    assert record.index_code == "BPI"
    assert record.ts == AWARE_TS
    assert record.ingestion_run_id == 7


def test_freight_rate_normalization_resolves_route_and_vessel_type() -> None:
    raw = c.RawRouteFreightRate(
        origin_unlocode="AUNTL",
        destination_unlocode="INPRT",
        vessel_type_code="CAPESIZE",
        ts=AWARE_TS,
        rate_value=Decimal("21.5"),
        rate_basis=RateBasis.VOYAGE_USD_PER_TONNE,
    )

    record = n.normalize_route_freight_rate(raw, RESOLVER, ingestion_run_id=7)

    assert (record.route_id, record.vessel_type_id) == (100, 10)
    assert record.rate_basis is RateBasis.VOYAGE_USD_PER_TONNE
    assert record.rate_value == Decimal("21.5")


def test_weather_normalization_resolves_port() -> None:
    raw = c.RawPortWeatherObservation(port_unlocode="INPRT", ts=AWARE_TS, wind_speed_ms=Decimal("5"))

    record = n.normalize_port_weather_observation(raw, RESOLVER, ingestion_run_id=7)

    assert record.port_id == 2
    assert record.ingestion_run_id == 7


def test_unknown_reference_raises() -> None:
    raw = c.RawBunkerPrice(port_unlocode="ZZZZZ", ts=AWARE_TS, price_usd_per_t=Decimal("600"))

    with pytest.raises(UnknownReferenceError):
        n.normalize_bunker_price(raw, RESOLVER, ingestion_run_id=7)
