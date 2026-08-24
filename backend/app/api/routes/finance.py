from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.finance import FinanceSummaryResponse
from app.services import finance_service

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("/summary", response_model=FinanceSummaryResponse)
def finance_summary(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> FinanceSummaryResponse:
    """Balance = valid income − valid expenses (FINANCIAL_RULES.md §7).

    Without explicit dates the balance covers transactions up to today;
    future-dated movements are excluded by default (FINANCIAL_RULES.md §9).
    """
    return finance_service.get_finance_summary(db, user, start_date=start_date, end_date=end_date)
