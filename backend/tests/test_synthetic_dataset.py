from datetime import timezone

from app.services.ingestion import contracts as c
from app.services.ingestion.synthetic import generate_dataset
from app.services.ingestion.validation import validate_payloads


def test_dataset_is_reproducible_for_a_seed() -> None:
    first = generate_dataset(days=5)
    second = generate_dataset(days=5)

    assert first == second


def test_different_seeds_produce_different_series() -> None:
    assert generate_dataset(days=5, seed=1) != generate_dataset(days=5, seed=2)


def test_dataset_is_marked_synthetic() -> None:
    assert generate_dataset(days=2).is_synthetic is True


def test_dataset_covers_multiple_dates_routes_and_vessel_types() -> None:
    dataset = generate_dataset(days=7)

    dates = {payload["ts"].date() for payload in dataset.route_freight_rates}
    vessel_types = {payload["vessel_type_code"] for payload in dataset.route_freight_rates}
    routes = {
        (payload["origin_unlocode"], payload["destination_unlocode"])
        for payload in dataset.route_freight_rates
    }

    assert len(dates) == 7
    assert vessel_types == {"CAPESIZE", "PANAMAX", "SUPRAMAX"}
    assert len(routes) == 9


def test_generated_timestamps_are_timezone_aware() -> None:
    dataset = generate_dataset(days=2)

    assert all(payload["ts"].tzinfo == timezone.utc for payload in dataset.baltic_index_values)


def test_generated_payloads_satisfy_the_contracts() -> None:
    dataset = generate_dataset(days=3)

    for contract, payloads in [
        (c.RawPort, dataset.ports),
        (c.RawVesselType, dataset.vessel_types),
        (c.RawRoute, dataset.routes),
        (c.RawVessel, dataset.vessels),
        (c.RawBalticIndexValue, dataset.baltic_index_values),
        (c.RawRouteFreightRate, dataset.route_freight_rates),
        (c.RawBunkerPrice, dataset.bunker_prices),
        (c.RawVesselPosition, dataset.vessel_positions),
        (c.RawPortWeatherObservation, dataset.port_weather_observations),
        (c.RawPortTideObservation, dataset.port_tide_observations),
    ]:
        result = validate_payloads(contract, payloads)
        assert len(result.accepted) == len(payloads)
