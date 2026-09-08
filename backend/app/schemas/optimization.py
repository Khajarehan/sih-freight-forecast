"""Pydantic schemas for OR-Tools freight chartering optimization."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OptimizationRequest(BaseModel):
    """Request payload for chartering optimization."""

    route_id: int = Field(..., description="ID of origin -> destination route")
    cargo_quantity_t: Decimal = Field(..., gt=0, description="Cargo volume to transport in metric tonnes")
    laycan_start: date = Field(..., description="Start of charter market entry window")
    laycan_end: date = Field(..., description="End of charter market entry window")
    candidate_vessel_type_ids: list[int] | None = Field(
        default=None, description="Optional list of candidate vessel type IDs to evaluate; if None, evaluates all"
    )


class EvaluatedCandidate(BaseModel):
    """Feasibility and cost evaluation details for a candidate vessel type."""

    vessel_type_id: int
    vessel_type_code: str
    vessel_type_name: str
    is_feasible: bool
    infeasibility_reasons: list[str] = []
    best_charter_date: datetime | None = None
    best_rate_usd_per_t: Decimal | None = None
    best_total_cost_usd: Decimal | None = None


class OptimalSolution(BaseModel):
    """Optimal vessel selection and chartering plan details."""

    vessel_type_id: int
    vessel_type_code: str
    vessel_type_name: str
    charter_date: datetime
    predicted_rate_usd_per_t: Decimal
    total_freight_cost_usd: Decimal
    estimated_loading_days: Decimal
    estimated_discharging_days: Decimal
    loading_tph_used: Decimal
    discharging_tph_used: Decimal
    is_origin_tph_fallback: bool
    is_destination_tph_fallback: bool


class OptimizationResponse(BaseModel):
    """Response payload containing optimization status, solution, and candidate analysis."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="OPTIMAL, INFEASIBLE, or FAILED")
    optimal_solution: OptimalSolution | None = None
    evaluated_candidates: list[EvaluatedCandidate] = []
    message: str | None = None
