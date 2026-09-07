"""Lookups from source-level natural keys to database identifiers."""

from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Port, Route, VesselType


class UnknownReferenceError(LookupError):
    """Raised when a raw record refers to reference data that does not exist."""


@dataclass
class ReferenceResolver:
    port_ids: dict[str, int] = field(default_factory=dict)
    vessel_type_ids: dict[str, int] = field(default_factory=dict)
    route_ids: dict[tuple[int, int], int] = field(default_factory=dict)

    def port_id(self, unlocode: str) -> int:
        try:
            return self.port_ids[unlocode]
        except KeyError as exc:
            raise UnknownReferenceError(f"Unknown port UN/LOCODE: {unlocode}") from exc

    def vessel_type_id(self, code: str) -> int:
        try:
            return self.vessel_type_ids[code]
        except KeyError as exc:
            raise UnknownReferenceError(f"Unknown vessel type code: {code}") from exc

    def route_id(self, origin_unlocode: str, destination_unlocode: str) -> int:
        key = (self.port_id(origin_unlocode), self.port_id(destination_unlocode))
        try:
            return self.route_ids[key]
        except KeyError as exc:
            raise UnknownReferenceError(
                f"Unknown route: {origin_unlocode} -> {destination_unlocode}"
            ) from exc


def load_resolver(session: Session) -> ReferenceResolver:
    return ReferenceResolver(
        port_ids={unlocode: port_id for port_id, unlocode in session.execute(select(Port.id, Port.unlocode))},
        vessel_type_ids={
            code: type_id for type_id, code in session.execute(select(VesselType.id, VesselType.code))
        },
        route_ids={
            (origin_id, destination_id): route_id
            for route_id, origin_id, destination_id in session.execute(
                select(Route.id, Route.origin_port_id, Route.destination_port_id)
            )
        },
    )
