import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.client import Client, ClientReference


def search_for_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    search: str | None = None,
    status: str | None = None,
    page: int,
    page_size: int,
) -> tuple[list[Client], int]:
    conditions = [Client.user_id == user_id]

    if status is not None:
        conditions.append(Client.status == status)

    if search:
        pattern = f"%{search}%"
        conditions.append(
            or_(
                func.lower(Client.full_name).like(func.lower(pattern)),
                Client.document_number.ilike(pattern),
                Client.phone.ilike(pattern),
            )
        )

    base_query = select(Client).where(*conditions)
    total_items = int(db.scalar(select(func.count()).select_from(base_query.subquery())) or 0)

    items = list(
        db.scalars(
            base_query.order_by(Client.full_name).limit(page_size).offset((page - 1) * page_size)
        ).all()
    )

    return items, total_items


def get_for_user(db: Session, client_id: uuid.UUID, user_id: uuid.UUID) -> Client | None:
    return db.scalar(select(Client).where(Client.id == client_id, Client.user_id == user_id))


def add(db: Session, client: Client) -> None:
    db.add(client)
    db.flush()


def list_references(db: Session, client_id: uuid.UUID, *, include_inactive: bool = True) -> list[ClientReference]:
    query = select(ClientReference).where(ClientReference.client_id == client_id)
    if not include_inactive:
        query = query.where(ClientReference.is_active.is_(True))
    return list(db.scalars(query.order_by(ClientReference.name)).all())


def get_reference(
    db: Session, reference_id: uuid.UUID, client_id: uuid.UUID
) -> ClientReference | None:
    return db.scalar(
        select(ClientReference).where(
            ClientReference.id == reference_id,
            ClientReference.client_id == client_id,
        )
    )


def add_reference(db: Session, reference: ClientReference) -> None:
    db.add(reference)
    db.flush()


def count_clients(db: Session, user_id: uuid.UUID, *, status: str = "ACTIVE") -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(Client)
            .where(Client.user_id == user_id, Client.status == status)
        )
        or 0
    )
