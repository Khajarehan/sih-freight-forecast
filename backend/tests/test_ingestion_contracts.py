from datetime import datetime, timezone
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models.enums import RateBasis
from app.services.ingestion import contracts as c
from app.services.ingestion.validation import validate_payloads

AWARE_TS = datetime(2026, 1, 1, tzinfo=timezone.utc)
NAIVE_TS = datetime(2026, 1, 1)


def test_valid_baltic_payload_is_accepted() -> None:
    record = c.RawBalticIndexValue.model_validate({"index_code": "BCI", "ts": AWARE_TS, "value": "2100.5"})

    assert record.index_code is c.BalticIndexCode.BCI
    assert record.value == Decimal("2100.5")


def test_naive_timestamp_is_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawBalticIndexValue(index_code=c.BalticIndexCode.BCI, ts=NAIVE_TS, value=Decimal("2100"))


@pytest.mark.parametrize(
    ("latitude", "longitude"),
    [(Decimal("91"), Decimal("0")), (Decimal("-91"), Decimal("0")), (Decimal("0"), Decimal("181"))],
)
def test_positions_outside_geographic_bounds_are_rejected(latitude: Decimal, longitude: Decimal) -> None:
    with pytest.raises(ValidationError):
        c.RawVesselPosition(imo="9000001", ts=AWARE_TS, latitude=latitude, longitude=longitude)


def test_position_within_bounds_is_accepted() -> None:
    record = c.RawVesselPosition(
        imo="9000001", ts=AWARE_TS, latitude=Decimal("17.6868"), longitude=Decimal("83.2185")
    )

    assert record.latitude == Decimal("17.6868")


def test_non_positive_price_is_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawBunkerPrice(port_unlocode="INPRT", ts=AWARE_TS, price_usd_per_t=Decimal("0"))


def test_non_positive_rate_is_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawRouteFreightRate(
            origin_unlocode="AUNTL",
            destination_unlocode="INPRT",
            vessel_type_code="CAPESIZE",
            ts=AWARE_TS,
            rate_value=Decimal("-1"),
            rate_basis=RateBasis.VOYAGE_USD_PER_TONNE,
        )


def test_non_positive_vessel_dimensions_are_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawVessel(imo="9000001", loa_m=Decimal("0"))


def test_empty_identifier_is_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawVesselType(code="  ", name="Capesize")


def test_malformed_imo_is_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawVesselPosition(imo="ABC", ts=AWARE_TS, latitude=Decimal("0"), longitude=Decimal("0"))


def test_negative_tide_height_is_accepted() -> None:
    record = c.RawPortTideObservation(port_unlocode="inprt", ts=AWARE_TS, tide_height_m=Decimal("-0.8"))

    assert record.port_unlocode == "INPRT"


def test_unknown_field_is_rejected() -> None:
    with pytest.raises(ValidationError):
        c.RawBalticIndexValue.model_validate(
            {"index_code": "BCI", "ts": AWARE_TS, "value": "1", "source": "x"}
        )


def test_lenient_validation_collects_rejected_payloads() -> None:
    result = validate_payloads(
        c.RawBalticIndexValue,
        [
            {"index_code": "BCI", "ts": AWARE_TS, "value": "2100"},
            {"index_code": "XXX", "ts": AWARE_TS, "value": "2100"},
        ],
        strict=False,
    )

    assert len(result.accepted) == 1
    assert [rejected.index for rejected in result.rejected] == [1]


def test_strict_validation_raises() -> None:
    with pytest.raises(ValidationError):
        validate_payloads(c.RawBalticIndexValue, [{"index_code": "XXX", "ts": AWARE_TS, "value": "1"}])
