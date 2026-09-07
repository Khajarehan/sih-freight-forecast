from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import RunStatus
from app.models.reference import Port, Vessel


class DataSource(TimestampMixin, Base):
    """External (or synthetic) provider of ingested data."""

    __tablename__ = "data_source"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    provider: Mapped[str | None] = mapped_column(String(120))


class IngestionRun(Base):
    """One ingestion execution; every observation row points back to its run."""

    __tablename__ = "ingestion_run"
    __table_args__ = (Index("ix_ingestion_run_data_source_id_started_at", "data_source_id", "started_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    data_source_id: Mapped[int] = mapped_column(ForeignKey("data_source.id"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[RunStatus] = mapped_column(Enum(RunStatus, name="run_status"))
    rows_ingested: Mapped[int | None]
    raw_object_uri: Mapped[str | None] = mapped_column(String(512))
    error_message: Mapped[str | None] = mapped_column(String(1024))
    is_synthetic: Mapped[bool] = mapped_column(default=False)

    data_source: Mapped[DataSource] = relationship()


class PortCall(Base):
    """Historical port call used for turnaround and demurrage modelling."""

    __tablename__ = "port_call"
    __table_args__ = (
        UniqueConstraint("vessel_imo", "port_id", "arrival_at"),
        Index("ix_port_call_port_id_arrival_at", "port_id", "arrival_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    vessel_imo: Mapped[str] = mapped_column(ForeignKey("vessel.imo"))
    port_id: Mapped[int] = mapped_column(ForeignKey("port.id"))
    arrival_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    berthed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    departure_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    turnaround_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    laytime_allowed_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    laytime_used_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    demurrage_usd: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))

    vessel: Mapped[Vessel] = relationship()
    port: Mapped[Port] = relationship()
