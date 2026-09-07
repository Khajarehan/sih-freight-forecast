from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Port(TimestampMixin, Base):
    """Port master data and physical/handling constraints."""

    __tablename__ = "port"

    id: Mapped[int] = mapped_column(primary_key=True)
    unlocode: Mapped[str] = mapped_column(String(5), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(2))
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    max_loa_m: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    max_beam_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    max_draft_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    cargo_handling_rate_tph: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    is_east_coast_india: Mapped[bool] = mapped_column(default=False)


class VesselType(TimestampMixin, Base):
    """Vessel class used for chartering decisions (Capesize, Panamax, ...)."""

    __tablename__ = "vessel_type"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    dwt_min_t: Mapped[int | None]
    dwt_max_t: Mapped[int | None]
    typical_loa_m: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    typical_beam_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    typical_draft_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))


class Vessel(TimestampMixin, Base):
    """Vessel master identity and dimensions used for port compatibility."""

    __tablename__ = "vessel"

    imo: Mapped[str] = mapped_column(String(7), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120))
    vessel_type_id: Mapped[int | None] = mapped_column(ForeignKey("vessel_type.id"))
    dwt_t: Mapped[int | None]
    loa_m: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    beam_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    draft_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    vessel_type: Mapped[VesselType | None] = relationship()


class CargoType(TimestampMixin, Base):
    """Bulk commodity master data."""

    __tablename__ = "cargo_type"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    stowage_factor_m3_per_t: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))


class Route(TimestampMixin, Base):
    """Origin/destination trade lane, the unit of freight forecasting."""

    __tablename__ = "route"
    __table_args__ = (UniqueConstraint("origin_port_id", "destination_port_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    origin_port_id: Mapped[int] = mapped_column(ForeignKey("port.id"), index=True)
    destination_port_id: Mapped[int] = mapped_column(ForeignKey("port.id"), index=True)
    distance_nm: Mapped[Decimal | None] = mapped_column(Numeric(8, 1))

    origin_port: Mapped[Port] = relationship(foreign_keys=[origin_port_id])
    destination_port: Mapped[Port] = relationship(foreign_keys=[destination_port_id])
