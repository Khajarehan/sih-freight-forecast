"""Deterministic synthetic dataset for development and testing.

This data is fabricated. It is not market data, it is not calibrated against
Baltic/AIS behaviour, and it must only ever be ingested with `is_synthetic=True`
so it stays distinguishable from real observations.
"""

import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models.enums import RateBasis
from app.services.ingestion import pipelines

DEFAULT_SEED = 42
DEFAULT_DAYS = 180
DEFAULT_ANCHOR_DATE = date(2026, 1, 1)

PORTS: list[dict[str, Any]] = [
    {
        "unlocode": "AUNTL",
        "name": "Newcastle",
        "country": "AU",
        "latitude": Decimal("-32.927800"),
        "longitude": Decimal("151.779100"),
        "max_loa_m": Decimal("300.00"),
        "max_beam_m": Decimal("50.00"),
        "max_draft_m": Decimal("17.50"),
        "cargo_handling_rate_tph": Decimal("6000.00"),
    },
    {
        "unlocode": "ZARBY",
        "name": "Richards Bay",
        "country": "ZA",
        "latitude": Decimal("-28.795600"),
        "longitude": Decimal("32.038900"),
        "max_loa_m": Decimal("300.00"),
        "max_beam_m": Decimal("50.00"),
        "max_draft_m": Decimal("17.50"),
        "cargo_handling_rate_tph": Decimal("5000.00"),
    },
    {
        "unlocode": "IDSMQ",
        "name": "Samarinda",
        "country": "ID",
        "latitude": Decimal("-0.502100"),
        "longitude": Decimal("117.153600"),
        "max_loa_m": Decimal("230.00"),
        "max_beam_m": Decimal("32.00"),
        "max_draft_m": Decimal("13.00"),
        "cargo_handling_rate_tph": Decimal("2500.00"),
    },
    {
        "unlocode": "INPRT",
        "name": "Paradip",
        "country": "IN",
        "latitude": Decimal("20.264400"),
        "longitude": Decimal("86.669400"),
        "max_loa_m": Decimal("290.00"),
        "max_beam_m": Decimal("45.00"),
        "max_draft_m": Decimal("17.10"),
        "cargo_handling_rate_tph": Decimal("4000.00"),
        "is_east_coast_india": True,
    },
    {
        "unlocode": "INVTZ",
        "name": "Visakhapatnam",
        "country": "IN",
        "latitude": Decimal("17.686800"),
        "longitude": Decimal("83.218500"),
        "max_loa_m": Decimal("300.00"),
        "max_beam_m": Decimal("47.00"),
        "max_draft_m": Decimal("18.10"),
        "cargo_handling_rate_tph": Decimal("4500.00"),
        "is_east_coast_india": True,
    },
    {
        "unlocode": "INENR",
        "name": "Kamarajar (Ennore)",
        "country": "IN",
        "latitude": Decimal("13.239700"),
        "longitude": Decimal("80.336000"),
        "max_loa_m": Decimal("260.00"),
        "max_beam_m": Decimal("43.00"),
        "max_draft_m": Decimal("16.00"),
        "cargo_handling_rate_tph": Decimal("3000.00"),
        "is_east_coast_india": True,
    },
]

VESSEL_TYPES: list[dict[str, Any]] = [
    {
        "code": "CAPESIZE",
        "name": "Capesize",
        "dwt_min_t": 100000,
        "dwt_max_t": 210000,
        "typical_loa_m": Decimal("292.00"),
        "typical_beam_m": Decimal("45.00"),
        "typical_draft_m": Decimal("18.20"),
    },
    {
        "code": "PANAMAX",
        "name": "Panamax",
        "dwt_min_t": 60000,
        "dwt_max_t": 99000,
        "typical_loa_m": Decimal("225.00"),
        "typical_beam_m": Decimal("32.30"),
        "typical_draft_m": Decimal("13.80"),
    },
    {
        "code": "SUPRAMAX",
        "name": "Supramax",
        "dwt_min_t": 45000,
        "dwt_max_t": 59000,
        "typical_loa_m": Decimal("199.00"),
        "typical_beam_m": Decimal("32.20"),
        "typical_draft_m": Decimal("12.80"),
    },
]

CARGO_TYPES: list[dict[str, Any]] = [
    {"code": "THERMAL_COAL", "name": "Thermal Coal", "stowage_factor_m3_per_t": Decimal("0.800")},
    {"code": "COKING_COAL", "name": "Coking Coal", "stowage_factor_m3_per_t": Decimal("0.780")},
    {"code": "IRON_ORE", "name": "Iron Ore", "stowage_factor_m3_per_t": Decimal("0.380")},
    {"code": "BAUXITE", "name": "Bauxite", "stowage_factor_m3_per_t": Decimal("0.550")},
]

ORIGIN_UNLOCODES = ["AUNTL", "ZARBY", "IDSMQ"]
DESTINATION_UNLOCODES = ["INPRT", "INVTZ", "INENR"]
BALTIC_INDEX_BASE = {"BCI": Decimal("2100"), "BPI": Decimal("1500"), "BSI": Decimal("1200")}

# Fabricated distances in nautical miles for each origin → destination pair.
ROUTE_DISTANCES: dict[tuple[str, str], Decimal] = {
    ("AUNTL", "INPRT"): Decimal("6520.0"),
    ("AUNTL", "INVTZ"): Decimal("6350.0"),
    ("AUNTL", "INENR"): Decimal("6080.0"),
    ("ZARBY", "INPRT"): Decimal("4780.0"),
    ("ZARBY", "INVTZ"): Decimal("4610.0"),
    ("ZARBY", "INENR"): Decimal("4890.0"),
    ("IDSMQ", "INPRT"): Decimal("3540.0"),
    ("IDSMQ", "INVTZ"): Decimal("3370.0"),
    ("IDSMQ", "INENR"): Decimal("3150.0"),
}


@dataclass
class SyntheticDataset:
    """Fabricated records; `is_synthetic` is always True."""

    is_synthetic: bool = True
    ports: list[dict[str, Any]] = field(default_factory=list)
    vessel_types: list[dict[str, Any]] = field(default_factory=list)
    cargo_types: list[dict[str, Any]] = field(default_factory=list)
    routes: list[dict[str, Any]] = field(default_factory=list)
    vessels: list[dict[str, Any]] = field(default_factory=list)
    baltic_index_values: list[dict[str, Any]] = field(default_factory=list)
    route_freight_rates: list[dict[str, Any]] = field(default_factory=list)
    bunker_prices: list[dict[str, Any]] = field(default_factory=list)
    vessel_positions: list[dict[str, Any]] = field(default_factory=list)
    port_weather_observations: list[dict[str, Any]] = field(default_factory=list)
    port_tide_observations: list[dict[str, Any]] = field(default_factory=list)


def _quantize(value: Decimal | float, places: str = "0.01") -> Decimal:
    return Decimal(str(value)).quantize(Decimal(places))


def generate_dataset(
    *,
    seed: int = DEFAULT_SEED,
    days: int = DEFAULT_DAYS,
    anchor_date: date = DEFAULT_ANCHOR_DATE,
    positions_per_day: int = 2,
) -> SyntheticDataset:
    """Generate an internally consistent fabricated dataset for `days` days."""
    rng = random.Random(seed)
    dataset = SyntheticDataset(
        ports=list(PORTS), vessel_types=list(VESSEL_TYPES), cargo_types=list(CARGO_TYPES),
    )

    dataset.routes = [
        {
            "origin_unlocode": origin,
            "destination_unlocode": destination,
            "distance_nm": ROUTE_DISTANCES.get((origin, destination)),
        }
        for origin in ORIGIN_UNLOCODES
        for destination in DESTINATION_UNLOCODES
    ]

    for index, vessel_type in enumerate(VESSEL_TYPES):
        for offset in range(2):
            number = 9000001 + index * 2 + offset
            dataset.vessels.append(
                {
                    "imo": str(number),
                    "name": f"DEMO {vessel_type['code']} {offset + 1}",
                    "vessel_type_code": vessel_type["code"],
                    "dwt_t": vessel_type["dwt_min_t"] + 1000 * (offset + 1),
                    "loa_m": vessel_type["typical_loa_m"],
                    "beam_m": vessel_type["typical_beam_m"],
                    "draft_m": vessel_type["typical_draft_m"],
                }
            )

    index_levels = dict(BALTIC_INDEX_BASE)
    start = anchor_date - timedelta(days=days - 1)

    for day in range(days):
        current = datetime.combine(start + timedelta(days=day), datetime.min.time(), tzinfo=timezone.utc)

        for code in BALTIC_INDEX_BASE:
            level = index_levels[code] * (Decimal(1) + Decimal(str(rng.uniform(-0.03, 0.03))))
            index_levels[code] = max(level, Decimal("100"))
            dataset.baltic_index_values.append(
                {"index_code": code, "ts": current, "value": _quantize(index_levels[code], "0.0001")}
            )

        for route in dataset.routes:
            for vessel_type in VESSEL_TYPES:
                index_code = {"CAPESIZE": "BCI", "PANAMAX": "BPI", "SUPRAMAX": "BSI"}[vessel_type["code"]]
                rate = index_levels[index_code] / Decimal(100) * Decimal(str(rng.uniform(0.9, 1.1)))
                dataset.route_freight_rates.append(
                    {
                        "origin_unlocode": route["origin_unlocode"],
                        "destination_unlocode": route["destination_unlocode"],
                        "vessel_type_code": vessel_type["code"],
                        "ts": current,
                        "rate_value": _quantize(rate, "0.0001"),
                        "rate_basis": RateBasis.VOYAGE_USD_PER_TONNE,
                    }
                )

        for unlocode in DESTINATION_UNLOCODES:
            dataset.bunker_prices.append(
                {
                    "port_unlocode": unlocode,
                    "fuel_grade": "VLSFO",
                    "ts": current,
                    "price_usd_per_t": _quantize(rng.uniform(500, 700), "0.0001"),
                }
            )
            dataset.port_weather_observations.append(
                {
                    "port_unlocode": unlocode,
                    "ts": current,
                    "wind_speed_ms": _quantize(rng.uniform(0, 18)),
                    "wave_height_m": _quantize(rng.uniform(0, 3)),
                    "precipitation_mm": _quantize(rng.uniform(0, 20)),
                    "visibility_m": rng.randrange(2000, 12000, 100),
                }
            )
            for hour in (0, 12):
                dataset.port_tide_observations.append(
                    {
                        "port_unlocode": unlocode,
                        "ts": current + timedelta(hours=hour),
                        "tide_height_m": _quantize(rng.uniform(-1.5, 2.5)),
                    }
                )

        for vessel in dataset.vessels:
            destination = DESTINATION_UNLOCODES[day % len(DESTINATION_UNLOCODES)]
            for slot in range(positions_per_day):
                dataset.vessel_positions.append(
                    {
                        "imo": vessel["imo"],
                        "ts": current + timedelta(hours=slot * (24 // positions_per_day)),
                        "latitude": _quantize(rng.uniform(-35, 22), "0.000001"),
                        "longitude": _quantize(rng.uniform(30, 155), "0.000001"),
                        "sog_kn": _quantize(rng.uniform(0, 14)),
                        "cog_deg": _quantize(rng.uniform(0, 360)),
                        "nav_status": "UNDER_WAY" if rng.random() > 0.2 else "AT_ANCHOR",
                        "destination_unlocode": destination,
                    }
                )

    return dataset


def seed_synthetic_dataset(
    session: Session,
    *,
    seed: int = DEFAULT_SEED,
    days: int = DEFAULT_DAYS,
    anchor_date: date = DEFAULT_ANCHOR_DATE,
) -> dict[str, pipelines.IngestionResult]:
    """Ingest a fabricated dataset, always flagged as synthetic."""
    dataset = generate_dataset(seed=seed, days=days, anchor_date=anchor_date)
    return {
        "reference": pipelines.ingest_reference_data(
            session,
            ports=dataset.ports,
            vessel_types=dataset.vessel_types,
            cargo_types=dataset.cargo_types,
            routes=dataset.routes,
            vessels=dataset.vessels,
            is_synthetic=True,
        ),

        "baltic_index_values": pipelines.ingest_baltic_index_values(
            session, dataset.baltic_index_values, is_synthetic=True
        ),
        "route_freight_rates": pipelines.ingest_route_freight_rates(
            session, dataset.route_freight_rates, is_synthetic=True
        ),
        "bunker_prices": pipelines.ingest_bunker_prices(session, dataset.bunker_prices, is_synthetic=True),
        "vessel_positions": pipelines.ingest_vessel_positions(
            session, dataset.vessel_positions, is_synthetic=True
        ),
        "port_weather_observations": pipelines.ingest_port_weather_observations(
            session, dataset.port_weather_observations, is_synthetic=True
        ),
        "port_tide_observations": pipelines.ingest_port_tide_observations(
            session, dataset.port_tide_observations, is_synthetic=True
        ),
    }
