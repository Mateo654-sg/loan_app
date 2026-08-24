from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.finance import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services import finance_service

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    type: str | None = Query(default=None, pattern="^(INCOME|EXPENSE)$"),
    is_active: bool | None = Query(default=None),
) -> list[CategoryResponse]:
    categories = finance_service.list_categories(db, user.id, type_filter=type, is_active=is_active)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CategoryResponse:
    category = finance_service.create_category(db, user.id, payload)
    return CategoryResponse.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CategoryResponse:
    from uuid import UUID

    category = finance_service.update_category(db, user.id, UUID(category_id), payload)
    return CategoryResponse.model_validate(category)


@router.post("/{category_id}/deactivate", response_model=CategoryResponse)
def deactivate_category(
    category_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CategoryResponse:
    from uuid import UUID

    category = finance_service.deactivate_category(db, user.id, UUID(category_id))
    return CategoryResponse.model_validate(category)
