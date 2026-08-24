import uuid

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.client import Client, ClientReference
from app.repositories import client_repository
from app.schemas.client import (
    ClientCreate,
    ClientSummaryResponse,
    ClientUpdate,
    ReferenceCreate,
    ReferenceResponse,
    ReferenceUpdate,
)
from app.schemas.common import format_money


def _get_client_or_404(db: Session, client_id: uuid.UUID, user_id: uuid.UUID) -> Client:
    client = client_repository.get_for_user(db, client_id, user_id)
    if client is None:
        # 404 without revealing whether another user owns it (API.md §66).
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)
    return client


def create_client(db: Session, user_id: uuid.UUID, payload: ClientCreate) -> Client:
    client = Client(user_id=user_id, **payload.model_dump())
    client_repository.add(db, client)
    db.commit()
    db.refresh(client)
    return client


def search_clients(
    db: Session,
    user_id: uuid.UUID,
    *,
    search: str | None,
    status: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Client], int]:
    return client_repository.search_for_user(
        db, user_id, search=search, status=status, page=page, page_size=page_size
    )


def get_client(db: Session, user_id: uuid.UUID, client_id: uuid.UUID) -> Client:
    return _get_client_or_404(db, client_id, user_id)


def update_client(
    db: Session, user_id: uuid.UUID, client_id: uuid.UUID, payload: ClientUpdate
) -> Client:
    client = _get_client_or_404(db, client_id, user_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client


def deactivate_client(db: Session, user_id: uuid.UUID, client_id: uuid.UUID) -> Client:
    """Deactivation keeps the client and its history (ROADMAP §8)."""
    client = _get_client_or_404(db, client_id, user_id)

    if client.status == "INACTIVE":
        raise AppError(
            code="CLIENT_ALREADY_INACTIVE",
            message="Client is already inactive.",
            http_status=409,
        )

    client.status = "INACTIVE"
    db.commit()
    db.refresh(client)
    return client


def get_client_summary(db: Session, user_id: uuid.UUID, client_id: uuid.UUID):
    """Customer financial summary (PRODUCT_SPEC §18).

    Loan-derived metrics are structurally defined by the API contract but
    remain 0 until the loan domain exists (Phase 6+); there are no loans to
    aggregate yet.
    """
    from decimal import Decimal

    client = _get_client_or_404(db, client_id, user_id)
    zero = format_money(Decimal(0))

    return ClientSummaryResponse(
        client_id=client.id,
        active_loans=0,
        total_capital_lent=zero,
        outstanding_capital=zero,
        total_receivable=zero,
        total_overdue=zero,
    )


# ---------- References ----------


def list_references(
    db: Session, user_id: uuid.UUID, client_id: uuid.UUID
) -> list[ReferenceResponse]:
    client = _get_client_or_404(db, client_id, user_id)
    references = client_repository.list_references(db, client.id)
    return [ReferenceResponse.model_validate(r) for r in references]


def create_reference(
    db: Session, user_id: uuid.UUID, client_id: uuid.UUID, payload: ReferenceCreate
) -> ReferenceResponse:
    client = _get_client_or_404(db, client_id, user_id)

    reference = ClientReference(client_id=client.id, **payload.model_dump())
    client_repository.add_reference(db, reference)
    db.commit()
    db.refresh(reference)
    return ReferenceResponse.model_validate(reference)


def update_reference(
    db: Session,
    user_id: uuid.UUID,
    client_id: uuid.UUID,
    reference_id: uuid.UUID,
    payload: ReferenceUpdate,
) -> ReferenceResponse:
    client = _get_client_or_404(db, client_id, user_id)
    reference = client_repository.get_reference(db, reference_id, client.id)
    if reference is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reference, field, value)

    db.commit()
    db.refresh(reference)
    return ReferenceResponse.model_validate(reference)


def deactivate_reference(
    db: Session, user_id: uuid.UUID, client_id: uuid.UUID, reference_id: uuid.UUID
) -> ReferenceResponse:
    client = _get_client_or_404(db, client_id, user_id)
    reference = client_repository.get_reference(db, reference_id, client.id)
    if reference is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    if not reference.is_active:
        raise AppError(
            code="REFERENCE_ALREADY_INACTIVE",
            message="Reference is already inactive.",
            http_status=409,
        )

    reference.is_active = False
    db.commit()
    db.refresh(reference)
    return ReferenceResponse.model_validate(reference)
