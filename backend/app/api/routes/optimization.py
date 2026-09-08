"""Endpoints for freight chartering optimization."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.optimization import OptimizationRequest, OptimizationResponse
from app.services.optimization.engine import OptimizationError, optimize_chartering

router = APIRouter(tags=["optimization"])


@router.post("/optimize", response_model=OptimizationResponse, status_code=200)
def run_optimization(
    body: OptimizationRequest,
    db: Session = Depends(get_db),
) -> OptimizationResponse:
    """Runs OR-Tools optimization engine for freight chartering decision support."""

    if body.laycan_end < body.laycan_start:
        raise HTTPException(
            status_code=422,
            detail=f"laycan_end ({body.laycan_end}) cannot be before laycan_start ({body.laycan_start})",
        )

    try:
        response = optimize_chartering(db, body)
        return response
    except OptimizationError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
