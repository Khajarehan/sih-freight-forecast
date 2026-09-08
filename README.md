# SIH 26006 — Intelligent Freight Forecasting Platform

An enterprise system that forecasts freight rates, recommends chartering timing and vessel classes using Google OR-Tools CP-SAT integer programming, visualizes maritime shipping routes on Mapbox GL JS, and surfaces weather and market risk warnings for bulk cargo procurement into East Coast India.

**Status: Phase 9 Completed.** Full stack containerization, CI automation, Mapbox GL GIS navigation, OR-Tools chartering optimizer, multi-horizon freight rate forecasting engine, and GCP Cloud Run / Cloud SQL deployment architecture.

## Architecture & Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Mapbox GL JS, Recharts |
| **Backend API** | FastAPI, Pydantic, SQLAlchemy 2, Alembic |
| **Optimization Engine** | Google OR-Tools CP-SAT Solver (Integer Programming) |
| **ML Forecast Service** | Multi-Horizon Quantile Freight Forecast Engine (Linear Trend Baseline v0.1.0) |
| **Containerization** | Docker, Multi-Stage Builds, Docker Compose |
| **CI / CD Pipeline** | GitHub Actions (`.github/workflows/ci.yml`) |
| **Cloud Deployment** | GCP Cloud Run, GCP Cloud SQL (PostgreSQL 16), GCP Secret Manager |

## Quick Start with Docker (Local Multi-Service Stack)

Run the full platform locally using Docker Compose:

```bash
# 1. Start all containers (PostgreSQL, DB Migration, FastAPI Backend, Next.js Frontend)
docker compose up --build

# 2. Access Web Dashboard & API
# Frontend Dashboard:  http://localhost:3000
# Backend API Health:   http://localhost:8000/api/v1/health
# OpenAPI Docs:        http://localhost:8000/docs

# Optional: Run with local Airflow stack
docker compose --profile airflow up --build
```

## Local Manual Development Setup

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Health endpoint: `http://localhost:8000/api/v1/health`
- Run Backend Tests:
  ```bash
  pytest
  ```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

- Dashboard UI: `http://localhost:3000`
- Production Build Check:
  ```bash
  npm run lint
  npm run build
  ```

## Continuous Integration Pipeline

The repository includes a GitHub Actions CI workflow (`.github/workflows/ci.yml`) that automatically runs on every push or pull request to `main`:

1. **Backend Tests & Migrations**: Executes Alembic schema migrations and runs the `pytest` suite.
2. **Frontend Lint & Build**: Runs `npm run lint` and validates `npm run build` (Next.js standalone output).
3. **Docker Image Smoke Tests**: Builds Docker container images for both backend and frontend to ensure zero container compilation errors.

## GCP Production Deployment (Cloud Run & Cloud SQL)

Production deployment is automated via `deploy/gcp/deploy.sh` and `deploy/gcp/cloudbuild.yaml`:

```bash
# Set GCP configuration variables
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="asia-south1"
export CLOUDSQL_INSTANCE="your-gcp-project-id:asia-south1:freight-db"

# Execute zero-downtime Cloud Run deployment script
./deploy/gcp/deploy.sh
```

### Production Security & Database Migration Strategy
- **Cloud SQL Migrations**: Database schema migrations (`alembic upgrade head`) execute via a single Cloud Run Job (`freight-migration-job`) prior to routing production traffic to new backend revisions.
- **Secret Manager**: Database URIs and API tokens are injected securely via `--set-secrets` (never committed to git or stored in image layers).
- **Rollback Protection**: Deployments use candidate revision health checks (`/api/v1/health`). Traffic automatically reverts to the previous healthy revision if candidate health probes fail.
