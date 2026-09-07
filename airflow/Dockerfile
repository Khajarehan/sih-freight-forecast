# Local development image: Airflow plus an isolated virtualenv holding the
# backend dependencies, so Airflow and application dependencies never mix.
# Build context is the repository root.
FROM apache/airflow:2.10.5-python3.11

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

USER airflow
COPY backend/requirements.txt /tmp/backend-requirements.txt
RUN python -m venv /home/airflow/backend-venv \
    && /home/airflow/backend-venv/bin/pip install --no-cache-dir --upgrade pip \
    && /home/airflow/backend-venv/bin/pip install --no-cache-dir -r /tmp/backend-requirements.txt
