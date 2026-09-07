from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ContractType, RunStatus
from app.models.reference import CargoType, Route, VesselType


class CharterEnquiry(Base):
    """Chartering request entered by a logistics manager."""

    __tablename__ = "charter_enquiry"

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("route.id"), index=True)
    cargo_type_id: Mapped[int] = mapped_column(ForeignKey("cargo_type.id"))
    cargo_quantity_t: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    laycan_start: Mapped[date] = mapped_column(Date)
    laycan_end: Mapped[date] = mapped_column(Date)
    contract_type: Mapped[ContractType] = mapped_column(Enum(ContractType, name="contract_type"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    route: Mapped[Route] = relationship()
    cargo_type: Mapped[CargoType] = relationship()


class ForecastRun(Base):
    """One execution of a forecast for a route and vessel type."""

    __tablename__ = "forecast_run"
    __table_args__ = (
        Index("ix_forecast_run_route_id_vessel_type_id_requested_at", "route_id", "vessel_type_id", "requested_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    charter_enquiry_id: Mapped[int | None] = mapped_column(ForeignKey("charter_enquiry.id"))
    route_id: Mapped[int] = mapped_column(ForeignKey("route.id"))
    vessel_type_id: Mapped[int] = mapped_column(ForeignKey("vessel_type.id"))
    model_name: Mapped[str] = mapped_column(String(64))
    model_version: Mapped[str] = mapped_column(String(32))
    status: Mapped[RunStatus] = mapped_column(Enum(RunStatus, name="run_status"))
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    artifact_uri: Mapped[str | None] = mapped_column(String(512))

    charter_enquiry: Mapped[CharterEnquiry | None] = relationship()
    route: Mapped[Route] = relationship()
    vessel_type: Mapped[VesselType] = relationship()
