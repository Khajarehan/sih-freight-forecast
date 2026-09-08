"""Baltic Exchange index value endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import BalticIndexValue
from app.schemas.baltic import BalticIndexResponse

router = APIRouter(tags=["baltic"])


@router.get("/baltic-indices", response_model=list[BalticIndexResponse])
def list_baltic_indices(
    index_code: str | None = Query(default=None, description="Filter by index code (BCI, BPI, BSI)"),
    limit: int = Query(default=500, ge=1, le=5000),
    db: Session = Depends(get_db),
) -> list[BalticIndexResponse]:
    statement = select(BalticIndexValue).order_by(BalticIndexValue.ts.desc()).limit(limit)
    if index_code is not None:
        statement = statement.where(BalticIndexValue.index_code == index_code.upper())
    values = db.execute(statement).scalars().all()
    return [BalticIndexResponse.model_validate(value) for value in values]
