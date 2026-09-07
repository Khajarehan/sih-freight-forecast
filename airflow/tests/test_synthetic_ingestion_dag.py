"""DAG structure checks. Run with the Airflow environment: `pytest airflow/tests`."""

from pathlib import Path

import pytest

pytest.importorskip("airflow", reason="Airflow is not installed in this environment")

from airflow.models import DagBag  # noqa: E402

DAGS_FOLDER = str(Path(__file__).resolve().parents[1] / "dags")
DAG_ID = "synthetic_ingestion"

OBSERVATION_TASK_IDS = {
    "ingest_baltic_index_values",
    "ingest_route_freight_rates",
    "ingest_bunker_prices",
    "ingest_vessel_positions",
    "ingest_port_weather_observations",
    "ingest_port_tide_observations",
}


@pytest.fixture(scope="module")
def dag_bag() -> DagBag:
    return DagBag(dag_folder=DAGS_FOLDER, include_examples=False)


def test_dags_import_without_errors(dag_bag: DagBag) -> None:
    assert dag_bag.import_errors == {}


def test_dag_is_in_the_dag_bag(dag_bag: DagBag) -> None:
    assert DAG_ID in dag_bag.dags


def test_dag_has_expected_tasks(dag_bag: DagBag) -> None:
    dag = dag_bag.dags[DAG_ID]

    assert set(dag.task_ids) == {"ingest_reference_data", "observations_complete"} | OBSERVATION_TASK_IDS


def test_reference_data_runs_before_observations(dag_bag: DagBag) -> None:
    dag = dag_bag.dags[DAG_ID]

    assert set(dag.get_task("ingest_reference_data").downstream_task_ids) == OBSERVATION_TASK_IDS
    for task_id in OBSERVATION_TASK_IDS:
        assert dag.get_task(task_id).downstream_task_ids == {"observations_complete"}


def test_catchup_is_disabled_and_retries_configured(dag_bag: DagBag) -> None:
    dag = dag_bag.dags[DAG_ID]

    assert dag.catchup is False
    assert dag.max_active_runs == 1
    assert dag.default_args["retries"] == 2
    assert dag.default_args["retry_delay"].total_seconds() > 0


def test_tasks_delegate_to_the_existing_ingestion_layer(dag_bag: DagBag) -> None:
    dag = dag_bag.dags[DAG_ID]

    for task_id in OBSERVATION_TASK_IDS | {"ingest_reference_data"}:
        command = dag.get_task(task_id).bash_command
        assert "app.services.ingestion.cli" in command

    dag_source = (Path(DAGS_FOLDER) / "synthetic_ingestion.py").read_text()
    for forbidden in ("normalize_", "validate_payloads", "session.add", "SessionLocal", "sqlalchemy"):
        assert forbidden not in dag_source
