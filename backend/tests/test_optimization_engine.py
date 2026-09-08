"""Unit tests for the OR-Tools optimization engine."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.models import Port, Route, RouteFreightRate, VesselType
from app.models.enums import RateBasis
from app.schemas.optimization import OptimizationRequest
from app.services.ingestion.synthetic import seed_synthetic_dataset
from app.services.optimization.engine import OptimizationError, optimize_chartering


def test_vessel_draft_infeasibility(db_session: Session) -> None:
    """A vessel whose typical draft exceeds the port max draft must be rejected."""
    seed_synthetic_dataset(db_session, days=15)

    route = db_session.query(Route).first()
    assert route is not None

    # Set origin port max draft to a restrictive 10.0m
    route.origin_port.max_draft_m = Decimal("10.0")
    db_session.flush()

    # Find a vessel type with typical draft > 10.0m (e.g. Capesize with 18.2m)
    capesize = db_session.query(VesselType).filter(VesselType.code == "CAPESIZE").first()
    assert capesize is not None
    capesize.typical_draft_m = Decimal("18.2")
    db_session.flush()

    request = OptimizationRequest(
        route_id=route.id,
        cargo_quantity_t=Decimal("50000"),
        laycan_start=date.today(),
        laycan_end=date.today() + timedelta(days=5),
        candidate_vessel_type_ids=[capesize.id],
    )

    response = optimize_chartering(db_session, request)

    assert response.status == "INFEASIBLE"
    assert len(response.evaluated_candidates) == 1
    candidate = response.evaluated_candidates[0]
    assert candidate.is_feasible is False
    assert any("draft" in r.lower() for r in candidate.infeasibility_reasons)


def test_vessel_loa_beam_infeasibility(db_session: Session) -> None:
    """Oversized LOA or beam must trigger hard constraint infeasibility."""
    seed_synthetic_dataset(db_session, days=15)

    route = db_session.query(Route).first()
    assert route is not None

    # Restrict port LOA and beam
    route.destination_port.max_loa_m = Decimal("200.0")
    route.destination_port.max_beam_m = Decimal("30.0")
    db_session.flush()

    capesize = db_session.query(VesselType).filter(VesselType.code == "CAPESIZE").first()
    assert capesize is not None
    capesize.typical_loa_m = Decimal("290.0")
    capesize.typical_beam_m = Decimal("45.0")
    capesize.typical_draft_m = Decimal("15.0")
    db_session.flush()

    request = OptimizationRequest(
        route_id=route.id,
        cargo_quantity_t=Decimal("50000"),
        laycan_start=date.today(),
        laycan_end=date.today() + timedelta(days=5),
        candidate_vessel_type_ids=[capesize.id],
    )

    response = optimize_chartering(db_session, request)

    assert response.status == "INFEASIBLE"
    candidate = response.evaluated_candidates[0]
    assert candidate.is_feasible is False
    assert any("loa" in r.lower() or "beam" in r.lower() for r in candidate.infeasibility_reasons)


def test_cargo_capacity_exceeded(db_session: Session) -> None:
    """Cargo volume exceeding max vessel dwt must be rejected."""
    seed_synthetic_dataset(db_session, days=15)

    route = db_session.query(Route).first()
    assert route is not None

    supramax = db_session.query(VesselType).filter(VesselType.code == "SUPRAMAX").first()
    assert supramax is not None
    supramax.dwt_max_t = 60000
    db_session.flush()

    # Request cargo quantity of 80,000t > 60,000t
    request = OptimizationRequest(
        route_id=route.id,
        cargo_quantity_t=Decimal("80000"),
        laycan_start=date.today(),
        laycan_end=date.today() + timedelta(days=5),
        candidate_vessel_type_ids=[supramax.id],
    )

    response = optimize_chartering(db_session, request)

    assert response.status == "INFEASIBLE"
    candidate = response.evaluated_candidates[0]
    assert candidate.is_feasible is False
    assert any("exceeds max vessel capacity" in r.lower() for r in candidate.infeasibility_reasons)


def test_optimal_date_and_vessel_selection(db_session: Session) -> None:
    """Optimizer should pick the vessel and charter date with minimum total cost."""
    seed_synthetic_dataset(db_session, days=30)

    route = db_session.query(Route).first()
    assert route is not None

    panamax = db_session.query(VesselType).filter(VesselType.code == "PANAMAX").first()
    assert panamax is not None

    # Clear physical restrictions
    route.origin_port.max_draft_m = None
    route.destination_port.max_draft_m = None

    start_date = date.today() + timedelta(days=1)
    end_date = date.today() + timedelta(days=3)

    request = OptimizationRequest(
        route_id=route.id,
        cargo_quantity_t=Decimal("65000"),
        laycan_start=start_date,
        laycan_end=end_date,
        candidate_vessel_type_ids=[panamax.id],
    )

    response = optimize_chartering(db_session, request)

    assert response.status == "OPTIMAL"
    assert response.optimal_solution is not None
    assert response.optimal_solution.vessel_type_code == "PANAMAX"

    assert response.optimal_solution.total_freight_cost_usd > 0
    assert start_date <= response.optimal_solution.charter_date.date() <= end_date


def test_cargo_handling_rate_fallback(db_session: Session) -> None:
    """Missing port cargo handling rate should trigger 2,000 tph fallback and set flags."""
    seed_synthetic_dataset(db_session, days=15)

    route = db_session.query(Route).first()
    assert route is not None

    # Set cargo handling rate to None
    route.origin_port.cargo_handling_rate_tph = None
    route.destination_port.cargo_handling_rate_tph = Decimal("3000.0")
    db_session.flush()

    panamax = db_session.query(VesselType).filter(VesselType.code == "PANAMAX").first()
    assert panamax is not None

    request = OptimizationRequest(
        route_id=route.id,
        cargo_quantity_t=Decimal("48000"),
        laycan_start=date.today(),
        laycan_end=date.today() + timedelta(days=2),
        candidate_vessel_type_ids=[panamax.id],
    )

    response = optimize_chartering(db_session, request)

    assert response.status == "OPTIMAL"
    assert response.optimal_solution is not None
    assert response.optimal_solution.is_origin_tph_fallback is True
    assert response.optimal_solution.is_destination_tph_fallback is False
    assert response.optimal_solution.loading_tph_used == Decimal("2000.0")
    # 48000 / (2000 * 24) = 1.0 day loading
    assert response.optimal_solution.estimated_loading_days == Decimal("1.00")


def test_invalid_route_id_raises_error(db_session: Session) -> None:
    """Non-existent route ID raises OptimizationError."""
    request = OptimizationRequest(
        route_id=999999,
        cargo_quantity_t=Decimal("50000"),
        laycan_start=date.today(),
        laycan_end=date.today() + timedelta(days=5),
    )

    with pytest.raises(OptimizationError):
        optimize_chartering(db_session, request)
