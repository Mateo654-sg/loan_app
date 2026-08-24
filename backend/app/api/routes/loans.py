from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.loan_repository import LoanFilters
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.loan import LoanCreate, LoanResponse, LoanScheduleResponse
from app.services import loan_service

router = APIRouter(prefix="/loans", tags=["loans"])


@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    payload: LoanCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LoanResponse:
    """Loan creation is a financial operation executed atomically with its
    persisted schedule (API.md §35). The mobile app never generates it."""
    loan, _installments = loan_service.create_loan(db, user.id, payload)

    # Return the authoritative detail (derived metrics + live status).
    return loan_service.get_loan_detail(db, user.id, loan.id)


@router.get("", response_model=PaginatedResponse[LoanResponse])
def list_loans(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    loan_status: str | None = Query(default=None, alias="status"),
    client_id: UUID | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[LoanResponse]:
    if loan_status is not None and loan_status not in ("ACTIVE", "PAID", "OVERDUE", "CANCELLED"):
        from app.core.errors import AppError

        raise AppError(
            code="VALIDATION_ERROR",
            message="Invalid loan status filter.",
            http_status=422,
        )

    items, total_items = loan_service.list_loans(
        db,
        user.id,
        filters=LoanFilters(
            status=loan_status,
            client_id=client_id,
            start_date=start_date,
            end_date=end_date,
        ),
        page=page,
        page_size=page_size,
    )

    return PaginatedResponse[LoanResponse](
        items=items,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=max((total_items + page_size - 1) // page_size, 1),
        ),
    )


@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(
    loan_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LoanResponse:
    return loan_service.get_loan_detail(db, user.id, loan_id)


@router.get("/{loan_id}/schedule", response_model=LoanScheduleResponse)
def get_loan_schedule(
    loan_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LoanScheduleResponse:
    return loan_service.get_loan_schedule(db, user.id, loan_id)


@router.post("/{loan_id}/cancel", response_model=LoanResponse)
def cancel_loan(
    loan_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LoanResponse:
    """Cancellation preserves all history; it never deletes (LOAN_RULES §48)."""
    loan = loan_service.cancel_loan(db, user.id, loan_id)
    return loan_service.get_loan_detail(db, user.id, loan.id)
