from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import BalticIndexValue, IngestionRun, Port
from app.services.ingestion import cli


def test_reference_source_persists_and_marks_synthetic(db_session: Session) -> None:
    summary = cli.run_synthetic_source("reference", days=2, session=db_session)

    run = db_session.get(IngestionRun, summary["ingestion_run_id"])

    assert summary["is_synthetic"] is True
    assert run.is_synthetic is True
    assert db_session.execute(select(func.count()).select_from(Port)).scalar_one() > 0


def test_observation_source_is_rerunnable(db_session: Session) -> None:
    cli.run_synthetic_source("baltic_index_values", days=2, session=db_session)
    cli.run_synthetic_source("baltic_index_values", days=2, session=db_session)

    assert db_session.execute(select(func.count()).select_from(BalticIndexValue)).scalar_one() == 6


def test_unknown_source_is_rejected() -> None:
    try:
        cli.run_synthetic_source("not_a_source")
    except ValueError as error:
        assert "Unknown synthetic source" in str(error)
    else:  # pragma: no cover - the call above must raise
        raise AssertionError("expected ValueError")
