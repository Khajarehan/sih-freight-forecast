"""Command-line entrypoint for orchestrators.

An orchestrator (Airflow) runs one source per invocation inside the backend
environment. All validation, normalization and persistence stays in the
ingestion services; this module only wires arguments to a pipeline call and owns
the transaction boundary.
"""

import argparse
import json
import sys
from collections.abc import Callable, Sequence

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.ingestion import pipelines
from app.services.ingestion.synthetic import (
    DEFAULT_DAYS,
    DEFAULT_SEED,
    SyntheticDataset,
    generate_dataset,
)

SyntheticSource = Callable[[Session, SyntheticDataset], pipelines.IngestionResult]

SYNTHETIC_SOURCES: dict[str, SyntheticSource] = {
    "reference": lambda session, dataset: pipelines.ingest_reference_data(
        session,
        ports=dataset.ports,
        vessel_types=dataset.vessel_types,
        routes=dataset.routes,
        vessels=dataset.vessels,
        is_synthetic=True,
    ),
    "baltic_index_values": lambda session, dataset: pipelines.ingest_baltic_index_values(
        session, dataset.baltic_index_values, is_synthetic=True
    ),
    "route_freight_rates": lambda session, dataset: pipelines.ingest_route_freight_rates(
        session, dataset.route_freight_rates, is_synthetic=True
    ),
    "bunker_prices": lambda session, dataset: pipelines.ingest_bunker_prices(
        session, dataset.bunker_prices, is_synthetic=True
    ),
    "vessel_positions": lambda session, dataset: pipelines.ingest_vessel_positions(
        session, dataset.vessel_positions, is_synthetic=True
    ),
    "port_weather_observations": lambda session, dataset: pipelines.ingest_port_weather_observations(
        session, dataset.port_weather_observations, is_synthetic=True
    ),
    "port_tide_observations": lambda session, dataset: pipelines.ingest_port_tide_observations(
        session, dataset.port_tide_observations, is_synthetic=True
    ),
}


def run_synthetic_source(
    source: str, *, seed: int = DEFAULT_SEED, days: int = DEFAULT_DAYS, session: Session | None = None
) -> dict[str, object]:
    """Ingest one synthetic source; commits on success, rolls back on failure."""
    if source not in SYNTHETIC_SOURCES:
        raise ValueError(f"Unknown synthetic source: {source}")

    dataset = generate_dataset(seed=seed, days=days)
    owned_session = session is None
    session = session or SessionLocal()
    try:
        result = SYNTHETIC_SOURCES[source](session, dataset)
        if owned_session:
            session.commit()
    except Exception:
        if owned_session:
            session.rollback()
        raise
    finally:
        if owned_session:
            session.close()

    return {
        "source": source,
        "ingestion_run_id": result.ingestion_run_id,
        "is_synthetic": result.is_synthetic,
        "rows_persisted": result.rows_persisted,
        "rejected": len(result.rejected),
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run an ingestion pipeline for one source.")
    parser.add_argument("--source", required=True, choices=sorted(SYNTHETIC_SOURCES))
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--days", type=int, default=DEFAULT_DAYS)
    arguments = parser.parse_args(argv)

    summary = run_synthetic_source(arguments.source, seed=arguments.seed, days=arguments.days)
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
