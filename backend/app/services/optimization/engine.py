"""OR-Tools Freight Chartering Optimization Engine.

Selects the optimal vessel type and market entry date within a laycan window
that minimizes total voyage freight cost while strictly enforcing hard physical
port and vessel constraints.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

from ortools.sat.python import cp_model
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ForecastPoint, ForecastRun, Port, Route, RouteFreightRate, VesselType
from app.models.enums import RateBasis
from app.schemas.optimization import (
    EvaluatedCandidate,
    OptimalSolution,
    OptimizationRequest,
    OptimizationResponse,
)
from app.services.forecast.engine import InsufficientDataError, run_forecast


DEFAULT_CARGO_HANDLING_RATE_TPH = Decimal("2000.0")


class OptimizationError(Exception):
    """Raised when optimization cannot proceed due to invalid inputs."""


def optimize_chartering(
    session: Session,
    request: OptimizationRequest,
) -> OptimizationResponse:
    """Runs OR-Tools CP-SAT optimizer to find the minimum-cost chartering plan."""

    # 1. Fetch Route and Ports
    route = session.execute(select(Route).where(Route.id == request.route_id)).scalars().first()
    if route is None:
        raise OptimizationError(f"Route with ID {request.route_id} not found")


    origin_port = route.origin_port
    dest_port = route.destination_port

    if origin_port is None or dest_port is None:
        raise OptimizationError(f"Route {request.route_id} missing origin or destination port details")

    # Handling rate fallbacks
    origin_tph = origin_port.cargo_handling_rate_tph
    is_origin_tph_fallback = False
    if origin_tph is None or origin_tph <= 0:
        origin_tph = DEFAULT_CARGO_HANDLING_RATE_TPH
        is_origin_tph_fallback = True

    dest_tph = dest_port.cargo_handling_rate_tph
    is_dest_tph_fallback = False
    if dest_tph is None or dest_tph <= 0:
        dest_tph = DEFAULT_CARGO_HANDLING_RATE_TPH
        is_dest_tph_fallback = True

    estimated_loading_days = (
        request.cargo_quantity_t / (origin_tph * Decimal("24"))
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    estimated_discharging_days = (
        request.cargo_quantity_t / (dest_tph * Decimal("24"))
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # 2. Query Candidate Vessel Types
    vessel_types_query = select(VesselType)
    if request.candidate_vessel_type_ids:
        vessel_types_query = vessel_types_query.where(VesselType.id.in_(request.candidate_vessel_type_ids))
    
    vessel_types = session.execute(vessel_types_query).scalars().all()
    if not vessel_types:
        return OptimizationResponse(
            status="INFEASIBLE",
            message="No candidate vessel types found matching request criteria",
            evaluated_candidates=[],
        )

    # Build date range for laycan window
    laycan_dates: list[date] = []
    curr_date = request.laycan_start
    while curr_date <= request.laycan_end:
        laycan_dates.append(curr_date)
        curr_date += timedelta(days=1)

    evaluated_candidates: list[EvaluatedCandidate] = []
    feasible_options: list[dict] = []

    # 3. Evaluate Physical Hard Constraints & Rates for Each Vessel Type
    for vt in vessel_types:
        reasons: list[str] = []

        # Constraint 1: Cargo Capacity
        if vt.dwt_max_t is not None and request.cargo_quantity_t > vt.dwt_max_t:
            reasons.append(
                f"Cargo quantity ({request.cargo_quantity_t}t) exceeds max vessel capacity ({vt.dwt_max_t}t)"
            )

        # Constraint 2: Origin Port Max Draft
        if origin_port.max_draft_m is not None and vt.typical_draft_m is not None:
            if vt.typical_draft_m > origin_port.max_draft_m:
                reasons.append(
                    f"Vessel draft ({vt.typical_draft_m}m) exceeds origin port ({origin_port.unlocode}) max draft ({origin_port.max_draft_m}m)"
                )

        # Constraint 3: Destination Port Max Draft
        if dest_port.max_draft_m is not None and vt.typical_draft_m is not None:
            if vt.typical_draft_m > dest_port.max_draft_m:
                reasons.append(
                    f"Vessel draft ({vt.typical_draft_m}m) exceeds destination port ({dest_port.unlocode}) max draft ({dest_port.max_draft_m}m)"
                )

        # Constraint 4: Origin Port Max LOA
        if origin_port.max_loa_m is not None and vt.typical_loa_m is not None:
            if vt.typical_loa_m > origin_port.max_loa_m:
                reasons.append(
                    f"Vessel LOA ({vt.typical_loa_m}m) exceeds origin port ({origin_port.unlocode}) max LOA ({origin_port.max_loa_m}m)"
                )

        # Constraint 5: Destination Port Max LOA
        if dest_port.max_loa_m is not None and vt.typical_loa_m is not None:
            if vt.typical_loa_m > dest_port.max_loa_m:
                reasons.append(
                    f"Vessel LOA ({vt.typical_loa_m}m) exceeds destination port ({dest_port.unlocode}) max LOA ({dest_port.max_loa_m}m)"
                )

        # Constraint 6: Origin Port Max Beam
        if origin_port.max_beam_m is not None and vt.typical_beam_m is not None:
            if vt.typical_beam_m > origin_port.max_beam_m:
                reasons.append(
                    f"Vessel beam ({vt.typical_beam_m}m) exceeds origin port ({origin_port.unlocode}) max beam ({origin_port.max_beam_m}m)"
                )

        # Constraint 7: Destination Port Max Beam
        if dest_port.max_beam_m is not None and vt.typical_beam_m is not None:
            if vt.typical_beam_m > dest_port.max_beam_m:
                reasons.append(
                    f"Vessel beam ({vt.typical_beam_m}m) exceeds destination port ({dest_port.unlocode}) max beam ({dest_port.max_beam_m}m)"
                )

        if reasons:
            evaluated_candidates.append(
                EvaluatedCandidate(
                    vessel_type_id=vt.id,
                    vessel_type_code=vt.code,
                    vessel_type_name=vt.name,
                    is_feasible=False,
                    infeasibility_reasons=reasons,
                )
            )
            continue

        # Vessel is physically feasible; fetch/generate rate trajectory for laycan window
        rates_by_date = _get_vessel_rates_for_laycan(
            session=session,
            route_id=request.route_id,
            vessel_type_id=vt.id,
            laycan_dates=laycan_dates,
        )

        if not rates_by_date:
            evaluated_candidates.append(
                EvaluatedCandidate(
                    vessel_type_id=vt.id,
                    vessel_type_code=vt.code,
                    vessel_type_name=vt.name,
                    is_feasible=False,
                    infeasibility_reasons=["No freight rate forecast or historical data available for laycan dates"],
                )
            )
            continue

        # Evaluate candidate options per day in laycan window
        best_candidate_cost: Decimal | None = None
        best_candidate_date: datetime | None = None
        best_candidate_rate: Decimal | None = None

        for dt, rate_val in rates_by_date.items():
            total_cost = (request.cargo_quantity_t * rate_val).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            dt_ts = datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)

            feasible_options.append(
                {
                    "vessel_type": vt,
                    "date": dt_ts,
                    "rate_usd_per_t": rate_val,
                    "total_cost_usd": total_cost,
                }
            )

            if best_candidate_cost is None or total_cost < best_candidate_cost:
                best_candidate_cost = total_cost
                best_candidate_date = dt_ts
                best_candidate_rate = rate_val

        evaluated_candidates.append(
            EvaluatedCandidate(
                vessel_type_id=vt.id,
                vessel_type_code=vt.code,
                vessel_type_name=vt.name,
                is_feasible=True,
                infeasibility_reasons=[],
                best_charter_date=best_candidate_date,
                best_rate_usd_per_t=best_candidate_rate,
                best_total_cost_usd=best_candidate_cost,
            )
        )

    if not feasible_options:
        return OptimizationResponse(
            status="INFEASIBLE",
            message="No candidate vessel type satisfies all physical port and vessel constraints",
            evaluated_candidates=evaluated_candidates,
        )

    # 4. OR-Tools CP-SAT Optimization Solver
    model = cp_model.CpModel()
    x_vars: dict[int, cp_model.IntVar] = {}

    for idx, opt in enumerate(feasible_options):
        # Scale cost to integer cents for CP-SAT
        cost_cents = int(round(float(opt["total_cost_usd"]) * 100))
        var = model.new_bool_var(f"x_{idx}")
        x_vars[idx] = var
        model.minimize(cost_cents * var)

    # Exactly one option must be selected
    model.add(sum(x_vars.values()) == 1)

    # Solve model
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return OptimizationResponse(
            status="INFEASIBLE",
            message="OR-Tools solver found no feasible solution",
            evaluated_candidates=evaluated_candidates,
        )

    # Identify selected option
    selected_idx = None
    for idx, var in x_vars.items():
        if solver.value(var) == 1:
            selected_idx = idx
            break

    if selected_idx is None:
        return OptimizationResponse(
            status="INFEASIBLE",
            message="Optimizer failed to identify selected solution index",
            evaluated_candidates=evaluated_candidates,
        )

    winning = feasible_options[selected_idx]
    winning_vt: VesselType = winning["vessel_type"]

    optimal_solution = OptimalSolution(
        vessel_type_id=winning_vt.id,
        vessel_type_code=winning_vt.code,
        vessel_type_name=winning_vt.name,
        charter_date=winning["date"],
        predicted_rate_usd_per_t=winning["rate_usd_per_t"],
        total_freight_cost_usd=winning["total_cost_usd"],
        estimated_loading_days=estimated_loading_days,
        estimated_discharging_days=estimated_discharging_days,
        loading_tph_used=origin_tph,
        discharging_tph_used=dest_tph,
        is_origin_tph_fallback=is_origin_tph_fallback,
        is_destination_tph_fallback=is_dest_tph_fallback,
    )

    return OptimizationResponse(
        status="OPTIMAL",
        optimal_solution=optimal_solution,
        evaluated_candidates=evaluated_candidates,
        message="Optimal chartering plan successfully computed",
    )


def _get_vessel_rates_for_laycan(
    session: Session,
    route_id: int,
    vessel_type_id: int,
    laycan_dates: list[date],
) -> dict[date, Decimal]:
    """Retrieves forecasted/historical rates for each day in laycan window."""

    rates_by_date: dict[date, Decimal] = {}

    # Check forecast points first
    fp_statement = (
        select(ForecastPoint)
        .join(ForecastRun, ForecastPoint.forecast_run_id == ForecastRun.id)
        .where(
            ForecastRun.route_id == route_id,
            ForecastRun.vessel_type_id == vessel_type_id,
            ForecastRun.status == "SUCCEEDED",
        )
        .order_by(ForecastPoint.target_ts.desc())
    )

    forecast_points = session.execute(fp_statement).scalars().all()
    for fp in forecast_points:
        dt = fp.target_ts.date()
        if dt in laycan_dates and dt not in rates_by_date:
            rates_by_date[dt] = fp.predicted_value

    # If forecast points don't cover all laycan dates, check RouteFreightRate
    missing_dates = [d for d in laycan_dates if d not in rates_by_date]
    if missing_dates:
        rfr_statement = (
            select(RouteFreightRate)
            .where(
                RouteFreightRate.route_id == route_id,
                RouteFreightRate.vessel_type_id == vessel_type_id,
                RouteFreightRate.rate_basis == RateBasis.VOYAGE_USD_PER_TONNE,
            )
            .order_by(RouteFreightRate.ts.desc())
        )
        rfr_list = session.execute(rfr_statement).scalars().all()
        for rfr in rfr_list:
            dt = rfr.ts.date()
            if dt in laycan_dates and dt not in rates_by_date:
                rates_by_date[dt] = rfr.rate_value

    # If still missing dates, try triggering run_forecast
    if len(rates_by_date) < len(laycan_dates):
        try:
            horizon = max(30, (max(laycan_dates) - date.today()).days + 15)
            forecast_run = run_forecast(
                session,
                route_id=route_id,
                vessel_type_id=vessel_type_id,
                horizon_days=horizon,
            )
            # Re-query forecast points for this run
            new_fp_statement = (
                select(ForecastPoint)
                .where(ForecastPoint.forecast_run_id == forecast_run.id)
            )
            new_fps = session.execute(new_fp_statement).scalars().all()
            for fp in new_fps:
                dt = fp.target_ts.date()
                if dt in laycan_dates and dt not in rates_by_date:
                    rates_by_date[dt] = fp.predicted_value
        except InsufficientDataError:
            pass

    # If still empty, fetch the single latest rate observation or forecast point for this route & vessel type
    if not rates_by_date:
        latest_rfr = session.execute(
            select(RouteFreightRate.rate_value)
            .where(
                RouteFreightRate.route_id == route_id,
                RouteFreightRate.vessel_type_id == vessel_type_id,
                RouteFreightRate.rate_basis == RateBasis.VOYAGE_USD_PER_TONNE,
            )
            .order_by(RouteFreightRate.ts.desc())
        ).scalars().first()

        if latest_rfr is None:
            latest_rfr = session.execute(
                select(ForecastPoint.predicted_value)
                .join(ForecastRun, ForecastPoint.forecast_run_id == ForecastRun.id)
                .where(
                    ForecastRun.route_id == route_id,
                    ForecastRun.vessel_type_id == vessel_type_id,
                )
                .order_by(ForecastPoint.target_ts.desc())
            ).scalars().first()

        if latest_rfr is not None:
            for d in laycan_dates:
                rates_by_date[d] = latest_rfr

    # If rates exist for some dates but not all, fill missing using nearest date's rate
    if rates_by_date and len(rates_by_date) < len(laycan_dates):
        known_dates = sorted(rates_by_date.keys())
        for d in laycan_dates:
            if d not in rates_by_date:
                # Find nearest date
                nearest = min(known_dates, key=lambda kd: abs((kd - d).days))
                rates_by_date[d] = rates_by_date[nearest]

    return rates_by_date

