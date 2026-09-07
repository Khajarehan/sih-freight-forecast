from app.db.base import Base
from app.models import CharterEnquiry, IngestionRun, Port, Route, RouteFreightRate, Vessel

EXPECTED_TABLES = {
    "port",
    "vessel_type",
    "vessel",
    "cargo_type",
    "route",
    "charter_enquiry",
    "forecast_run",
    "data_source",
    "ingestion_run",
    "port_call",
    "baltic_index_value",
    "route_freight_rate",
    "bunker_price",
    "vessel_position",
    "port_congestion_metric",
    "port_weather_observation",
    "port_tide_observation",
    "forecast_point",
}


def test_metadata_contains_all_tables() -> None:
    assert set(Base.metadata.tables) == EXPECTED_TABLES


def test_naming_convention_is_applied() -> None:
    assert Base.metadata.naming_convention["pk"] == "pk_%(table_name)s"
    assert Port.__table__.primary_key.name == "pk_port"


def test_port_unlocode_is_unique() -> None:
    assert Port.__table__.c.unlocode.unique is True


def test_route_endpoints_are_unique_together() -> None:
    unique_columns = {
        tuple(sorted(column.name for column in constraint.columns))
        for constraint in Route.__table__.constraints
        if constraint.__class__.__name__ == "UniqueConstraint"
    }
    assert ("destination_port_id", "origin_port_id") in unique_columns


def test_time_series_primary_keys_include_timestamp() -> None:
    assert [column.name for column in RouteFreightRate.__table__.primary_key] == [
        "route_id",
        "vessel_type_id",
        "rate_basis",
        "ts",
    ]


def test_foreign_keys_and_relationships_are_defined() -> None:
    assert {fk.target_fullname for fk in CharterEnquiry.__table__.c.route_id.foreign_keys} == {"route.id"}
    assert {fk.target_fullname for fk in IngestionRun.__table__.c.data_source_id.foreign_keys} == {
        "data_source.id"
    }
    assert Vessel.vessel_type.property.mapper.class_.__name__ == "VesselType"


def test_timestamps_are_timezone_aware() -> None:
    assert Port.__table__.c.created_at.type.timezone is True
    assert RouteFreightRate.__table__.c.ts.type.timezone is True
