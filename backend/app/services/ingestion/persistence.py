"""Persistence step: write normalized records through the existing session."""

from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import DataSource, IngestionRun, RunStatus


class SourceCode:
    """Codes for the `data_source` rows this phase supports."""

    BALTIC = "BALTIC"
    AIS = "AIS"
    BUNKER = "BUNKER"
    WEATHER = "WEATHER"
    TIDE = "TIDE"
    FREIGHT_RATE = "FREIGHT_RATE"
    REFERENCE = "REFERENCE"


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def get_or_create_data_source(session: Session, code: str, name: str | None = None) -> DataSource:
    source = session.execute(select(DataSource).where(DataSource.code == code)).scalar_one_or_none()
    if source is None:
        source = DataSource(code=code, name=name or code)
        session.add(source)
        session.flush()
    return source


def start_ingestion_run(session: Session, source_code: str, *, is_synthetic: bool = False) -> IngestionRun:
    run = IngestionRun(
        data_source_id=get_or_create_data_source(session, source_code).id,
        started_at=_utcnow(),
        status=RunStatus.RUNNING,
        is_synthetic=is_synthetic,
    )
    session.add(run)
    session.flush()
    return run


def persist_records(session: Session, records: Sequence[Base]) -> int:
    """Write normalized records idempotently (re-ingesting a period updates rows)."""
    for record in records:
        session.merge(record)
    session.flush()
    return len(records)


@contextmanager
def ingestion_run(session: Session, source_code: str, *, is_synthetic: bool = False) -> Iterator[IngestionRun]:
    """Run an ingestion, recording provenance and outcome on `ingestion_run`."""
    run = start_ingestion_run(session, source_code, is_synthetic=is_synthetic)
    try:
        yield run
    except Exception as error:
        run.status = RunStatus.FAILED
        run.completed_at = _utcnow()
        run.error_message = str(error)[:1024]
        session.flush()
        raise
    run.status = RunStatus.SUCCEEDED
    run.completed_at = _utcnow()
    session.flush()
