"""Source pipelines: validate -> normalize -> persist.

Each pipeline is a plain function taking a session and raw payloads, so an
orchestrator (Airflow, a CLI, a test) can call it without the ingestion package
depending on the orchestrator.
"""

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CargoType, Port, Route, Vessel, VesselType
from app.services.ingestion import contracts as c
from app.services.ingestion import normalizers as n
from app.services.ingestion.persistence import SourceCode, ingestion_run, persist_records
from app.services.ingestion.references import ReferenceResolver, load_resolver
from app.services.ingestion.validation import RejectedPayload, validate_payloads

Payloads = Iterable[Mapping[str, Any]]


@dataclass
class IngestionResult:
    ingestion_run_id: int
    is_synthetic: bool
    rows_persisted: int
    rejected: list[RejectedPayload]


def _finish(run, rows: int, rejected: list[RejectedPayload]) -> IngestionResult:
    run.rows_ingested = rows
    return IngestionResult(
        ingestion_run_id=run.id,
        is_synthetic=run.is_synthetic,
        rows_persisted=rows,
        rejected=rejected,
    )


def ingest_baltic_index_values(
    session: Session, payloads: Payloads, *, is_synthetic: bool = False, strict: bool = True
) -> IngestionResult:
    validated = validate_payloads(c.RawBalticIndexValue, payloads, strict=strict)
    with ingestion_run(session, SourceCode.BALTIC, is_synthetic=is_synthetic) as run:
        rows = persist_records(
            session, [n.normalize_baltic_index_value(raw, run.id) for raw in validated.accepted]
        )
        return _finish(run, rows, validated.rejected)


def ingest_route_freight_rates(
    session: Session, payloads: Payloads, *, is_synthetic: bool = False, strict: bool = True
) -> IngestionResult:
    validated = validate_payloads(c.RawRouteFreightRate, payloads, strict=strict)
    resolver = load_resolver(session)
    with ingestion_run(session, SourceCode.FREIGHT_RATE, is_synthetic=is_synthetic) as run:
        rows = persist_records(
            session,
            [n.normalize_route_freight_rate(raw, resolver, run.id) for raw in validated.accepted],
        )
        return _finish(run, rows, validated.rejected)


def ingest_bunker_prices(
    session: Session, payloads: Payloads, *, is_synthetic: bool = False, strict: bool = True
) -> IngestionResult:
    validated = validate_payloads(c.RawBunkerPrice, payloads, strict=strict)
    resolver = load_resolver(session)
    with ingestion_run(session, SourceCode.BUNKER, is_synthetic=is_synthetic) as run:
        rows = persist_records(
            session, [n.normalize_bunker_price(raw, resolver, run.id) for raw in validated.accepted]
        )
        return _finish(run, rows, validated.rejected)


def ingest_vessel_positions(
    session: Session, payloads: Payloads, *, is_synthetic: bool = False, strict: bool = True
) -> IngestionResult:
    validated = validate_payloads(c.RawVesselPosition, payloads, strict=strict)
    with ingestion_run(session, SourceCode.AIS, is_synthetic=is_synthetic) as run:
        rows = persist_records(
            session, [n.normalize_vessel_position(raw, run.id) for raw in validated.accepted]
        )
        return _finish(run, rows, validated.rejected)


def ingest_port_weather_observations(
    session: Session, payloads: Payloads, *, is_synthetic: bool = False, strict: bool = True
) -> IngestionResult:
    validated = validate_payloads(c.RawPortWeatherObservation, payloads, strict=strict)
    resolver = load_resolver(session)
    with ingestion_run(session, SourceCode.WEATHER, is_synthetic=is_synthetic) as run:
        rows = persist_records(
            session,
            [n.normalize_port_weather_observation(raw, resolver, run.id) for raw in validated.accepted],
        )
        return _finish(run, rows, validated.rejected)


def ingest_port_tide_observations(
    session: Session, payloads: Payloads, *, is_synthetic: bool = False, strict: bool = True
) -> IngestionResult:
    validated = validate_payloads(c.RawPortTideObservation, payloads, strict=strict)
    resolver = load_resolver(session)
    with ingestion_run(session, SourceCode.TIDE, is_synthetic=is_synthetic) as run:
        rows = persist_records(
            session,
            [n.normalize_port_tide_observation(raw, resolver, run.id) for raw in validated.accepted],
        )
        return _finish(run, rows, validated.rejected)


def ingest_reference_data(
    session: Session,
    *,
    ports: Sequence[Mapping[str, Any]] = (),
    vessel_types: Sequence[Mapping[str, Any]] = (),
    cargo_types: Sequence[Mapping[str, Any]] = (),
    routes: Sequence[Mapping[str, Any]] = (),
    vessels: Sequence[Mapping[str, Any]] = (),
    is_synthetic: bool = False,
) -> IngestionResult:
    """Upsert reference/master data by natural key."""
    raw_ports = validate_payloads(c.RawPort, ports).accepted
    raw_types = validate_payloads(c.RawVesselType, vessel_types).accepted
    raw_cargo_types = validate_payloads(c.RawCargoType, cargo_types).accepted
    raw_routes = validate_payloads(c.RawRoute, routes).accepted
    raw_vessels = validate_payloads(c.RawVessel, vessels).accepted

    with ingestion_run(session, SourceCode.REFERENCE, is_synthetic=is_synthetic) as run:
        rows = 0
        for raw_port in raw_ports:
            rows += _upsert(session, Port, {"unlocode": raw_port.unlocode}, n.normalize_port(raw_port))
        for raw_type in raw_types:
            rows += _upsert(
                session, VesselType, {"code": raw_type.code}, n.normalize_vessel_type(raw_type)
            )
        for raw_cargo in raw_cargo_types:
            rows += _upsert(
                session, CargoType, {"code": raw_cargo.code}, n.normalize_cargo_type(raw_cargo)
            )
        session.flush()

        resolver = load_resolver(session)
        for raw_route in raw_routes:
            route = n.normalize_route(raw_route, resolver)
            rows += _upsert(
                session,
                Route,
                {
                    "origin_port_id": route.origin_port_id,
                    "destination_port_id": route.destination_port_id,
                },
                route,
            )
        for raw_vessel in raw_vessels:
            rows += _upsert(session, Vessel, {"imo": raw_vessel.imo}, n.normalize_vessel(raw_vessel, resolver))
        session.flush()
        return _finish(run, rows, [])


def _upsert(session: Session, model: type, natural_key: Mapping[str, Any], candidate: Any) -> int:
    statement = select(model).filter_by(**natural_key)
    existing = session.execute(statement).scalar_one_or_none()
    if existing is None:
        session.add(candidate)
        return 1
    for column in model.__table__.columns.keys():
        if column in natural_key or column in {"id", "created_at", "updated_at"}:
            continue
        setattr(existing, column, getattr(candidate, column))
    return 1


def resolver_for(session: Session) -> ReferenceResolver:
    return load_resolver(session)
