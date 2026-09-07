from datetime import datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import BalticIndexValue, IngestionRun, Port, RouteFreightRate, RunStatus, VesselPosition
from app.services.ingestion import pipelines
from app.services.ingestion.synthetic import generate_dataset, seed_synthetic_dataset

AWARE_TS = datetime(2026, 1, 1, tzinfo=timezone.utc)


def test_baltic_ingestion_records_provenance(db_session: Session) -> None:
    result = pipelines.ingest_baltic_index_values(
        db_session, [{"index_code": "BCI", "ts": AWARE_TS, "value": "2100"}]
    )

    run = db_session.get(IngestionRun, result.ingestion_run_id)
    value = db_session.execute(select(BalticIndexValue)).scalar_one()

    assert run.status is RunStatus.SUCCEEDED
    assert run.rows_ingested == 1
    assert run.is_synthetic is False
    assert value.ingestion_run_id == run.id


def test_failed_ingestion_marks_run_failed(db_session: Session) -> None:
    with pytest.raises(Exception):
        pipelines.ingest_bunker_prices(
            db_session, [{"port_unlocode": "ZZZZZ", "ts": AWARE_TS, "price_usd_per_t": "600"}]
        )

    run = db_session.execute(select(IngestionRun)).scalars().one()
    assert run.status is RunStatus.FAILED
    assert run.error_message


def test_reingestion_is_idempotent(db_session: Session) -> None:
    payloads = [{"index_code": "BPI", "ts": AWARE_TS, "value": "1500"}]
    pipelines.ingest_baltic_index_values(db_session, payloads)
    pipelines.ingest_baltic_index_values(db_session, payloads)

    assert db_session.execute(select(func.count()).select_from(BalticIndexValue)).scalar_one() == 1


def test_synthetic_seed_marks_every_run_synthetic(db_session: Session) -> None:
    results = seed_synthetic_dataset(db_session, days=3)
    dataset = generate_dataset(days=3)

    assert all(result.is_synthetic for result in results.values())
    assert all(run.is_synthetic for run in db_session.execute(select(IngestionRun)).scalars())

    assert db_session.execute(select(func.count()).select_from(Port)).scalar_one() == len(dataset.ports)
    assert db_session.execute(select(func.count()).select_from(RouteFreightRate)).scalar_one() == len(
        dataset.route_freight_rates
    )
    assert db_session.execute(select(func.count()).select_from(VesselPosition)).scalar_one() == len(
        dataset.vessel_positions
    )


def test_persisted_freight_rate_keeps_value_and_basis(db_session: Session) -> None:
    seed_synthetic_dataset(db_session, days=2)

    rate = db_session.execute(select(RouteFreightRate)).scalars().first()

    assert rate.rate_value > Decimal("0")
    assert rate.rate_basis.value == "VOYAGE_USD_PER_TONNE"
    assert rate.ts.tzinfo is not None
