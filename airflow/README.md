# Airflow orchestration (local development)

Airflow is the orchestration layer only. DAG tasks shell into the backend
environment and call the existing ingestion services in
`backend/app/services/ingestion/` through its CLI entrypoint
(`app.services.ingestion.cli`). Validation, normalization and persistence stay in
the backend; no ingestion logic lives in a DAG file.

Airflow and the backend keep separate dependency environments: the image installs
`backend/requirements.txt` into `/home/airflow/backend-venv`, which the tasks use.
Airflow is deliberately absent from `backend/requirements.txt`.

```
airflow/
├── dags/synthetic_ingestion.py   synthetic/demo ingestion DAG
├── tests/                        DAG-bag and structure checks
├── Dockerfile                    Airflow image + isolated backend virtualenv
├── docker-compose.yml            local development stack
├── .env.example                  required environment variables
└── README.md
```

No `plugins/` directory: no custom operator, hook or macro is needed.

## Synthetic/demo data

The DAG ingests the deterministic fabricated dataset from
`app/services/ingestion/synthetic.py` (Baltic indices, route freight rates, VLSFO
prices, AIS positions, port weather and tides). It is **not** market data and is
not calibrated against real markets. Every run is written with
`ingestion_run.is_synthetic = true`, and re-running the DAG updates the same rows
instead of duplicating them.

## Environment variables

Copy the template and fill in local values — never commit `airflow/.env`:

```bash
cd airflow && cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `AIRFLOW_UID` | host uid used by the containers (`id -u`) |
| `AIRFLOW_DB_USER` / `AIRFLOW_DB_PASSWORD` / `AIRFLOW_DB_NAME` | Airflow metadata database (separate from the application database) |
| `AIRFLOW_WWW_USER` / `AIRFLOW_WWW_PASSWORD` | local Airflow UI login |
| `AIRFLOW_WEB_PORT` | host port for the UI (default 8080) |
| `APP_DB_USER` / `APP_DB_PASSWORD` / `APP_DB_NAME` / `APP_DB_PORT` | the local application PostgreSQL container |
| `APP_DATABASE_URL` | connection string the ingestion services use; point it at an existing database to skip the bundled `app-db` |
| `SYNTHETIC_INGESTION_SEED` | random seed, keeps generated data reproducible |
| `SYNTHETIC_INGESTION_DAYS` | number of days of synthetic history per run |

## Start

```bash
cd airflow
docker compose up -d
```

`airflow-init` runs `airflow db migrate`, creates the local admin user, and applies
the application's own Alembic migrations to `APP_DATABASE_URL`. The application
schema is owned by Alembic; Airflow never redefines it.

## View the DAG

Open http://localhost:8080 and log in with `AIRFLOW_WWW_USER` / `AIRFLOW_WWW_PASSWORD`.
The DAG is `synthetic_ingestion` (daily at 02:00 UTC, `catchup=False`, paused on
creation). From the CLI:

```bash
docker compose exec airflow-scheduler airflow dags list
docker compose exec airflow-scheduler airflow dags list-import-errors
```

## Trigger it manually

```bash
docker compose exec airflow-scheduler airflow dags unpause synthetic_ingestion
docker compose exec airflow-scheduler airflow dags trigger synthetic_ingestion
docker compose exec airflow-scheduler airflow dags list-runs -d synthetic_ingestion
```

Task order is `ingest_reference_data` → the six observation tasks → `observations_complete`,
because observations carry foreign keys to ports, routes, vessel types and vessels.
Each task commits its own transaction and rolls back on failure, so Airflow retries
(2 attempts, 5 minutes apart) are safe.

## Stop

```bash
docker compose down          # keep databases
docker compose down -v       # also delete the database volumes
```

## Tests

The DAG checks need an Airflow environment, not the backend virtualenv:

```bash
pytest airflow/tests
```
