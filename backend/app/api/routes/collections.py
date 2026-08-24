from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.collection import (
    CollectionsListResponse,
    TodayCollectionsResponse,
)
from app.services import collection_service

router = APIRouter(prefix="/collections", tags=["collections"])


def _user_tz(user: User) -> str:
    return user.timezone if user.timezone else "America/Bogota"


@router.get("/today", response_model=TodayCollectionsResponse)
def today_collections(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TodayCollectionsResponse:
    """Due-today + outstanding overdue with day summary (API.md §49).
    'Today' uses the authenticated user's configured timezone."""
    return collection_service.get_today_collections(db, user.id, _user_tz(user))


@router.get("", response_model=CollectionsListResponse)
def list_collections(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    filter: str = Query(default="ALL"),
    client_id: UUID | None = Query(default=None),
    loan_id: UUID | None = Query(default=None),
) -> CollectionsListResponse:
    try:
        collection_filter = collection_service.CollectionFilter(filter)
    except ValueError:
        from app.core.errors import AppError

        raise AppError(
            code="VALIDATION_ERROR",
            message="filter must be one of TODAY, THIS_WEEK, THIS_MONTH, OVERDUE, UPCOMING, ALL",
            http_status=422,
        ) from None

    return collection_service.list_collections(
        db,
        user.id,
        _user_tz(user),
        collection_filter=collection_filter,
        client_id=client_id,
        loan_id=loan_id,
    )
