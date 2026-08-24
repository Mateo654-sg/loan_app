from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.client import (
    ClientCreate,
    ClientResponse,
    ClientSummaryResponse,
    ClientUpdate,
    ReferenceCreate,
    ReferenceResponse,
    ReferenceUpdate,
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.services import client_service

router = APIRouter(prefix="/clients", tags=["clients"])

settings = get_settings()


@router.get("", response_model=PaginatedResponse[ClientResponse])
def list_clients(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(default=None, max_length=255),
    client_status: str | None = Query(
        default=None, alias="status", pattern="^(ACTIVE|INACTIVE)$"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ClientResponse]:
    items, total_items = client_service.search_clients(
        db, user.id, search=search, status=client_status, page=page, page_size=page_size
    )

    return PaginatedResponse[ClientResponse](
        items=[ClientResponse.model_validate(c) for c in items],
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=max((total_items + page_size - 1) // page_size, 1),
        ),
    )


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientResponse:
    client = client_service.create_client(db, user.id, payload)
    return ClientResponse.model_validate(client)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientResponse:
    return ClientResponse.model_validate(client_service.get_client(db, user.id, client_id))


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID,
    payload: ClientUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientResponse:
    client = client_service.update_client(db, user.id, client_id, payload)
    return ClientResponse.model_validate(client)


@router.post("/{client_id}/deactivate", response_model=ClientResponse)
def deactivate_client(
    client_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientResponse:
    client = client_service.deactivate_client(db, user.id, client_id)
    return ClientResponse.model_validate(client)


@router.get("/{client_id}/summary", response_model=ClientSummaryResponse)
def client_summary(
    client_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientSummaryResponse:
    """Loan metrics are zero until the loan domain exists (Phase 6+)."""
    return client_service.get_client_summary(db, user.id, client_id)


# ---------- References ----------


@router.get("/{client_id}/references", response_model=list[ReferenceResponse])
def list_references(
    client_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ReferenceResponse]:
    return client_service.list_references(db, user.id, client_id)


@router.post(
    "/{client_id}/references",
    response_model=ReferenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reference(
    client_id: UUID,
    payload: ReferenceCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ReferenceResponse:
    return client_service.create_reference(db, user.id, client_id, payload)


@router.patch("/{client_id}/references/{reference_id}", response_model=ReferenceResponse)
def update_reference(
    client_id: UUID,
    reference_id: UUID,
    payload: ReferenceUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ReferenceResponse:
    return client_service.update_reference(db, user.id, client_id, reference_id, payload)


@router.post(
    "/{client_id}/references/{reference_id}/deactivate",
    response_model=ReferenceResponse,
)
def deactivate_reference(
    client_id: UUID,
    reference_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ReferenceResponse:
    return client_service.deactivate_reference(db, user.id, client_id, reference_id)
