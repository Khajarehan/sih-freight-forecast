"""Normalization of validated raw records into ORM instances.

Normalizers are pure: they resolve natural keys through a `ReferenceResolver`,
attach ingestion provenance, and return unattached ORM objects.
"""

from app.models import (
    BalticIndexValue,
    BunkerPrice,
    CargoType,
    Port,
    PortTideObservation,
    PortWeatherObservation,
    Route,
    RouteFreightRate,
    Vessel,
    VesselPosition,
    VesselType,
)
from app.services.ingestion import contracts as c
from app.services.ingestion.references import ReferenceResolver


def normalize_port(raw: c.RawPort) -> Port:
    return Port(
        unlocode=raw.unlocode,
        name=raw.name,
        country=raw.country,
        latitude=raw.latitude,
        longitude=raw.longitude,
        max_loa_m=raw.max_loa_m,
        max_beam_m=raw.max_beam_m,
        max_draft_m=raw.max_draft_m,
        cargo_handling_rate_tph=raw.cargo_handling_rate_tph,
        is_east_coast_india=raw.is_east_coast_india,
    )


def normalize_cargo_type(raw: c.RawCargoType) -> CargoType:
    return CargoType(
        code=raw.code,
        name=raw.name,
        stowage_factor_m3_per_t=raw.stowage_factor_m3_per_t,
    )


def normalize_vessel_type(raw: c.RawVesselType) -> VesselType:
    return VesselType(
        code=raw.code,
        name=raw.name,
        dwt_min_t=raw.dwt_min_t,
        dwt_max_t=raw.dwt_max_t,
        typical_loa_m=raw.typical_loa_m,
        typical_beam_m=raw.typical_beam_m,
        typical_draft_m=raw.typical_draft_m,
    )



def normalize_route(raw: c.RawRoute, resolver: ReferenceResolver) -> Route:
    return Route(
        origin_port_id=resolver.port_id(raw.origin_unlocode),
        destination_port_id=resolver.port_id(raw.destination_unlocode),
        distance_nm=raw.distance_nm,
    )


def normalize_vessel(raw: c.RawVessel, resolver: ReferenceResolver) -> Vessel:
    return Vessel(
        imo=raw.imo,
        name=raw.name,
        vessel_type_id=(
            resolver.vessel_type_id(raw.vessel_type_code) if raw.vessel_type_code is not None else None
        ),
        dwt_t=raw.dwt_t,
        loa_m=raw.loa_m,
        beam_m=raw.beam_m,
        draft_m=raw.draft_m,
    )


def normalize_baltic_index_value(raw: c.RawBalticIndexValue, ingestion_run_id: int) -> BalticIndexValue:
    return BalticIndexValue(
        index_code=raw.index_code.value,
        ts=raw.ts,
        value=raw.value,
        ingestion_run_id=ingestion_run_id,
    )


def normalize_route_freight_rate(
    raw: c.RawRouteFreightRate, resolver: ReferenceResolver, ingestion_run_id: int
) -> RouteFreightRate:
    return RouteFreightRate(
        route_id=resolver.route_id(raw.origin_unlocode, raw.destination_unlocode),
        vessel_type_id=resolver.vessel_type_id(raw.vessel_type_code),
        rate_basis=raw.rate_basis,
        ts=raw.ts,
        rate_value=raw.rate_value,
        ingestion_run_id=ingestion_run_id,
    )


def normalize_bunker_price(
    raw: c.RawBunkerPrice, resolver: ReferenceResolver, ingestion_run_id: int
) -> BunkerPrice:
    return BunkerPrice(
        port_id=resolver.port_id(raw.port_unlocode),
        fuel_grade=raw.fuel_grade,
        ts=raw.ts,
        price_usd_per_t=raw.price_usd_per_t,
        ingestion_run_id=ingestion_run_id,
    )


def normalize_vessel_position(raw: c.RawVesselPosition, ingestion_run_id: int) -> VesselPosition:
    return VesselPosition(
        imo=raw.imo,
        ts=raw.ts,
        latitude=raw.latitude,
        longitude=raw.longitude,
        sog_kn=raw.sog_kn,
        cog_deg=raw.cog_deg,
        nav_status=raw.nav_status,
        destination_unlocode=raw.destination_unlocode,
        ingestion_run_id=ingestion_run_id,
    )


def normalize_port_weather_observation(
    raw: c.RawPortWeatherObservation, resolver: ReferenceResolver, ingestion_run_id: int
) -> PortWeatherObservation:
    return PortWeatherObservation(
        port_id=resolver.port_id(raw.port_unlocode),
        ts=raw.ts,
        wind_speed_ms=raw.wind_speed_ms,
        wave_height_m=raw.wave_height_m,
        precipitation_mm=raw.precipitation_mm,
        visibility_m=raw.visibility_m,
        ingestion_run_id=ingestion_run_id,
    )


def normalize_port_tide_observation(
    raw: c.RawPortTideObservation, resolver: ReferenceResolver, ingestion_run_id: int
) -> PortTideObservation:
    return PortTideObservation(
        port_id=resolver.port_id(raw.port_unlocode),
        ts=raw.ts,
        tide_height_m=raw.tide_height_m,
        ingestion_run_id=ingestion_run_id,
    )
