from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.finance import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.repositories.finance_repository import TransactionFilters
from app.services import finance_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=PaginatedResponse[TransactionResponse])
def list_transactions(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    type: str | None = Query(default=None, pattern="^(INCOME|EXPENSE)$"),
    category_id: UUID | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    transaction_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(ACTIVE|CANCELLED|ALL)$",
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[TransactionResponse]:
    status_value = transaction_status or "ACTIVE"
    filters = TransactionFilters(
        type_filter=type,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
        status=None if status_value == "ALL" else status_value,
    )

    items, total_items = finance_service.list_transactions(
        db, user.id, filters, page=page, page_size=page_size
    )

    return PaginatedResponse[TransactionResponse](
        items=[TransactionResponse.from_model(t) for t in items],
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=max((total_items + page_size - 1) // page_size, 1),
        ),
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TransactionResponse:
    transaction = finance_service.get_transaction(db, user.id, transaction_id)
    return TransactionResponse.from_model(transaction)


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TransactionResponse:
    transaction = finance_service.create_transaction(db, user.id, payload)
    return TransactionResponse.from_model(transaction)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TransactionResponse:
    transaction = finance_service.update_transaction(db, user.id, transaction_id, payload)
    return TransactionResponse.from_model(transaction)


@router.post("/{transaction_id}/cancel", response_model=TransactionResponse)
def cancel_transaction(
    transaction_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TransactionResponse:
    """Cancellation instead of physical deletion (API.md §20)."""
    transaction = finance_service.cancel_transaction(db, user.id, transaction_id)
    return TransactionResponse.from_model(transaction)
