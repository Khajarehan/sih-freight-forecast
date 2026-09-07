"""timescaledb hypertables

Isolated TimescaleDB step. It is a no-op unless TIMESCALE_ENABLED is true, so
ordinary PostgreSQL development needs neither the extension nor this migration's
effects. When TimescaleDB is explicitly requested but unavailable, the migration
fails instead of silently degrading.

Revision ID: 8a1c4f2b7e10
Revises: 3d8f77f3cd0f
Create Date: 2026-09-07 18:30:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.core.config import get_settings

revision: str = "8a1c4f2b7e10"
down_revision: str | None = "3d8f77f3cd0f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# table -> time partitioning column
HYPERTABLES: dict[str, str] = {
    "baltic_index_value": "ts",
    "route_freight_rate": "ts",
    "bunker_price": "ts",
    "vessel_position": "ts",
    "port_congestion_metric": "ts",
    "port_weather_observation": "ts",
    "port_tide_observation": "ts",
    "forecast_point": "target_ts",
}


def upgrade() -> None:
    if not get_settings().timescale_enabled:
        return

    connection = op.get_bind()
    available = connection.execute(
        sa.text("SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb'")
    ).scalar()
    if not available:
        raise RuntimeError(
            "TIMESCALE_ENABLED is true but the timescaledb extension is not available "
            "on this PostgreSQL server. Install TimescaleDB or unset TIMESCALE_ENABLED."
        )

    connection.execute(sa.text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
    for table, time_column in HYPERTABLES.items():
        connection.execute(
            sa.text(
                "SELECT create_hypertable(:table, :time_column, "
                "if_not_exists => TRUE, migrate_data => TRUE)"
            ),
            {"table": table, "time_column": time_column},
        )


def downgrade() -> None:
    # Hypertables cannot be converted back to plain tables; the tables themselves
    # are dropped by the core schema migration.
    pass
