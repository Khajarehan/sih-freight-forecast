"""Synthetic/demo ingestion DAG.

Orchestration only: every task shells into the backend environment and calls the
existing ingestion services through `app.services.ingestion.cli`. No validation,
normalization or persistence logic lives in this file, and the backend keeps its
own virtualenv so Airflow and application dependencies stay separate.

The data produced by this DAG is fabricated development data. Every run is
recorded with `ingestion_run.is_synthetic = true`.
"""

import os
from datetime import datetime, timedelta

import pendulum
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator

BACKEND_HOME = os.environ.get("BACKEND_HOME", "/opt/airflow/backend")
BACKEND_PYTHON = os.environ.get("BACKEND_PYTHON", "/home/airflow/backend-venv/bin/python")
INGESTION_CLI = "app.services.ingestion.cli"
SYNTHETIC_SEED = os.environ.get("SYNTHETIC_INGESTION_SEED", "42")
SYNTHETIC_DAYS = os.environ.get("SYNTHETIC_INGESTION_DAYS", "180")

# Reference data must exist before observations, which carry foreign keys to it.
OBSERVATION_SOURCES = [
    "baltic_index_values",
    "route_freight_rates",
    "bunker_prices",
    "vessel_positions",
    "port_weather_observations",
    "port_tide_observations",
]

DEFAULT_ARGS = {
    "owner": "data-platform",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(minutes=30),
}


def _ingest_command(source: str) -> str:
    return (
        f"cd {BACKEND_HOME} && "
        f"{BACKEND_PYTHON} -m {INGESTION_CLI} "
        f"--source {source} --seed {SYNTHETIC_SEED} --days {SYNTHETIC_DAYS}"
    )


with DAG(
    dag_id="synthetic_ingestion",
    description="Ingest the deterministic synthetic/demo dataset (not real market data)",
    default_args=DEFAULT_ARGS,
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.UTC),
    schedule="0 2 * * *",
    catchup=False,
    max_active_runs=1,
    tags=["ingestion", "synthetic", "development"],
) as dag:
    ingest_reference_data = BashOperator(
        task_id="ingest_reference_data",
        bash_command=_ingest_command("reference"),
    )

    observations_complete = EmptyOperator(task_id="observations_complete")

    for source in OBSERVATION_SOURCES:
        ingest_observations = BashOperator(
            task_id=f"ingest_{source}",
            bash_command=_ingest_command(source),
        )
        ingest_reference_data >> ingest_observations >> observations_complete
