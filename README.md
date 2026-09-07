# SIH 26006 — Intelligent Freight Forecasting Platform

Project foundation (Phase 1) for a system that will forecast freight rates, recommend
chartering timing and vessel types, and surface risk warnings for bulk cargo procurement
into the East Coast of India.

**Status: Phase 1 only.** No forecasting model, no datasets, no authentication, no external
integrations. The official problem statement provides no dataset; the data strategy is
deliberately deferred.

## Stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| Frontend  | Next.js (App Router), TypeScript, Tailwind  |
| API       | FastAPI, Pydantic                           |
| Data/ML   | pandas, numpy, scikit-learn (not yet used)  |
| Database  | PostgreSQL via SQLAlchemy + Alembic         |

## Layout

```
backend/
  app/
    api/routes/       API route modules (health)
    core/             settings/configuration
    db/               SQLAlchemy base and session
    models/           ORM models
    schemas/          Pydantic schemas
    services/
      ingestion/      source contracts, validation, normalization, persistence
  alembic/            migration environment
  tests/              pytest suite
frontend/
  src/app/            App Router pages
  src/components/     UI components
  src/lib/            API client
```

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Health endpoint: http://localhost:8000/api/v1/health
- OpenAPI docs: http://localhost:8000/docs

The app starts without a running PostgreSQL instance: connections are lazy and the health
endpoint reports `"database": "unavailable"` when the database cannot be reached.

Run tests:

```bash
cd backend && .venv/bin/python -m pytest
```

Database-backed tests are skipped unless `TEST_DATABASE_URL` points at a disposable
PostgreSQL database:

```bash
cd backend && TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/freight_test \
  .venv/bin/python -m pytest
```

## Database and migrations

Set `DATABASE_URL` in `backend/.env` (see `backend/.env.example`). Once a PostgreSQL
instance exists:

```bash
cd backend
alembic revision --autogenerate -m "message"
alembic upgrade head
```

The schema is split into a core migration (all tables, plain PostgreSQL) and an
isolated TimescaleDB migration that converts the time-series tables into
hypertables. The TimescaleDB step is a no-op unless `TIMESCALE_ENABLED=true`, and
fails explicitly if it is requested on a server without the extension.

## Data ingestion

`app/services/ingestion/` implements the pipeline `raw payload -> contract validation ->
normalization -> persistence`. Each source has a pipeline function taking a SQLAlchemy
session and raw payloads, so an orchestrator (Airflow later) calls these services rather
than containing the ingestion logic. Every observation carries `ingestion_run_id`, and
`ingestion_run.is_synthetic` marks non-real data.

`app/services/ingestion/synthetic.py` generates a seeded, fabricated development dataset
(Baltic indices, freight rates, VLSFO prices, AIS positions, weather, tides). It is not
market data and is not calibrated against real markets; it is always ingested with
`is_synthetic=True`.

```python
from app.db.session import SessionLocal
from app.services.ingestion.synthetic import seed_synthetic_dataset

with SessionLocal() as session:
    seed_synthetic_dataset(session, days=180)
    session.commit()
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 — the page calls the backend health endpoint and shows the
result. Checks:

```bash
npm run lint
npm run build
```

## Environment variables

| File                    | Variable                   | Purpose                        |
| ----------------------- | -------------------------- | ------------------------------ |
| `backend/.env`          | `ENVIRONMENT`              | environment label              |
| `backend/.env`          | `DATABASE_URL`             | PostgreSQL connection string   |
| `backend/.env`          | `TIMESCALE_ENABLED`        | enable the hypertable migration|
| `backend/.env`          | `CORS_ORIGINS`             | comma-separated allowed origins|
| `frontend/.env.local`   | `NEXT_PUBLIC_API_BASE_URL` | backend API base URL           |

Never commit real secrets; only `.env.example` files are tracked.
