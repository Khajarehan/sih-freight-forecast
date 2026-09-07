from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import RateBasis

# Every table in this module is append-only and time-partitioned on its timestamp
# column; the timestamp is part of the primary key so the tables can be converted
# into TimescaleDB hypertables without dropping constraints.


class BalticIndexValue(Base):
    """Daily Baltic Exchange index level (BCI/BPI/BSI)."""

    __tablename__ = "baltic_index_value"
    __table_args__ = (Index("ix_baltic_index_value_index_code_ts", "index_code", "ts"),)

    index_code: Mapped[str] = mapped_column(String(16), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    value: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class RouteFreightRate(Base):
    """Observed freight rate per route and vessel type; the forecast target."""

    __tablename__ = "route_freight_rate"
    __table_args__ = (
        Index("ix_route_freight_rate_route_id_vessel_type_id_ts", "route_id", "vessel_type_id", "ts"),
    )

    route_id: Mapped[int] = mapped_column(ForeignKey("route.id"), primary_key=True)
    vessel_type_id: Mapped[int] = mapped_column(ForeignKey("vessel_type.id"), primary_key=True)
    rate_basis: Mapped[RateBasis] = mapped_column(Enum(RateBasis, name="rate_basis"), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    rate_value: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class BunkerPrice(Base):
    """Bunker fuel price (VLSFO and other grades) at a bunkering port."""

    __tablename__ = "bunker_price"
    __table_args__ = (Index("ix_bunker_price_port_id_fuel_grade_ts", "port_id", "fuel_grade", "ts"),)

    port_id: Mapped[int] = mapped_column(ForeignKey("port.id"), primary_key=True)
    fuel_grade: Mapped[str] = mapped_column(String(16), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    price_usd_per_t: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class VesselPosition(Base):
    """AIS position report for a known vessel."""

    __tablename__ = "vessel_position"
    __table_args__ = (Index("ix_vessel_position_imo_ts", "imo", "ts"),)

    imo: Mapped[str] = mapped_column(ForeignKey("vessel.imo"), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    sog_kn: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    cog_deg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    nav_status: Mapped[str | None] = mapped_column(String(32))
    destination_unlocode: Mapped[str | None] = mapped_column(String(5))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class PortCongestionMetric(Base):
    """Derived port queue/waiting metrics."""

    __tablename__ = "port_congestion_metric"
    __table_args__ = (Index("ix_port_congestion_metric_port_id_ts", "port_id", "ts"),)

    port_id: Mapped[int] = mapped_column(ForeignKey("port.id"), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    vessels_waiting: Mapped[int]
    avg_waiting_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class PortWeatherObservation(Base):
    """Weather observation at a port."""

    __tablename__ = "port_weather_observation"
    __table_args__ = (Index("ix_port_weather_observation_port_id_ts", "port_id", "ts"),)

    port_id: Mapped[int] = mapped_column(ForeignKey("port.id"), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    wind_speed_ms: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    wave_height_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    precipitation_mm: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    visibility_m: Mapped[int | None]
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class PortTideObservation(Base):
    """Tidal height observation/prediction at a port."""

    __tablename__ = "port_tide_observation"
    __table_args__ = (Index("ix_port_tide_observation_port_id_ts", "port_id", "ts"),)

    port_id: Mapped[int] = mapped_column(ForeignKey("port.id"), primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    tide_height_m: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    ingestion_run_id: Mapped[int | None] = mapped_column(ForeignKey("ingestion_run.id"))


class ForecastPoint(Base):
    """Point of a forecast horizon produced by a forecast run."""

    __tablename__ = "forecast_point"

    forecast_run_id: Mapped[int] = mapped_column(ForeignKey("forecast_run.id"), primary_key=True)
    target_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    predicted_value: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    p10: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    p50: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    p90: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
