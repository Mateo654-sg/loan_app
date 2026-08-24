from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.payment_repository import allocations_for_payment
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    ReversalRequest,
)
from app.services import payment_service

router = APIRouter(prefix="/loans/{loan_id}/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def register_payment(
    loan_id: UUID,
    payload: PaymentCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    idempotency_key: Annotated[Optional[str], Header(alias="Idempotency-Key")] = None,
) -> PaymentResponse:
    """Atomic financial operation (API.md §42). Retries with the same
    Idempotency-Key return the original result without duplicating it."""
    payment, allocations = payment_service.register_payment(
        db,
        user.id,
        loan_id,
        payload,
        idempotency_key=idempotency_key.strip() if idempotency_key else None,
    )
    return PaymentResponse.from_model(payment, allocations)


@router.get("", response_model=PaginatedResponse[PaymentResponse])
def list_payments(
    loan_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[PaymentResponse]:
    """Chronological history; reversed payments remain visible (§48)."""
    items, total_items = payment_service.list_payments_for_loan(
        db, user.id, loan_id, page=page, page_size=page_size
    )

    return PaginatedResponse[PaymentResponse](
        items=[
            PaymentResponse.from_model(p, allocations_for_payment(db, p.id)) for p in items
        ],
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=max((total_items + page_size - 1) // page_size, 1),
        ),
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    loan_id: UUID,
    payment_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PaymentResponse:
    """Detail includes the authoritative allocation breakdown (API.md §45)."""
    return payment_service.get_payment_detail(db, user.id, loan_id, payment_id)


@router.post("/{payment_id}/reverse", response_model=PaymentResponse)
def reverse_payment(
    loan_id: UUID,
    payment_id: UUID,
    payload: ReversalRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PaymentResponse:
    """Reversal restores balances from stored allocations; never deletes."""
    payment = payment_service.reverse_payment(db, user.id, loan_id, payment_id, payload)
    return PaymentResponse.from_model(payment, allocations_for_payment(db, payment.id))
