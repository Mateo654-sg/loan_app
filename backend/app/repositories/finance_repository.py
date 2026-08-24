import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category, Transaction


def list_for_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    type_filter: str | None = None,
    is_active: bool | None = None,
) -> list[Category]:
    query = select(Category).where(Category.user_id == user_id)

    if type_filter is not None:
        query = query.where(Category.type == type_filter)
    if is_active is not None:
        query = query.where(Category.is_active == is_active)

    return list(db.scalars(query.order_by(Category.name)).all())


def get_for_user(db: Session, category_id: uuid.UUID, user_id: uuid.UUID) -> Category | None:
    """Ownership-scoped lookup: returns the category only if it belongs to user."""
    return db.scalar(select(Category).where(Category.id == category_id, Category.user_id == user_id))


def find_by_name(db: Session, user_id: uuid.UUID, name: str, type_value: str) -> Category | None:
    """Case-insensitive duplicate lookup among ACTIVE categories (DATABASE.md §11)."""
    return db.scalar(
        select(Category).where(
            Category.user_id == user_id,
            Category.type == type_value,
            Category.is_active.is_(True),
            func.lower(Category.name) == name.lower(),
        )
    )


def add(db: Session, category: Category) -> None:
    db.add(category)
    db.flush()


def count_transactions(db: Session, category_id: uuid.UUID) -> int:
    return int(
        db.scalar(select(func.count()).select_from(Transaction).where(Transaction.category_id == category_id))
        or 0
    )


# ---------- Transactions ----------


class TransactionFilters:
    def __init__(
        self,
        *,
        type_filter: str | None = None,
        category_id: uuid.UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        status: str = "ACTIVE",
    ) -> None:
        self.type_filter = type_filter
        self.category_id = category_id
        self.start_date = start_date
        self.end_date = end_date
        self.status = status


def list_transactions(
    db: Session,
    user_id: uuid.UUID,
    filters: TransactionFilters,
    *,
    page: int,
    page_size: int,
) -> tuple[list[Transaction], int]:
    conditions = [Transaction.user_id == user_id]

    if filters.type_filter is not None:
        conditions.append(Transaction.type == filters.type_filter)
    if filters.category_id is not None:
        conditions.append(Transaction.category_id == filters.category_id)
    if filters.start_date is not None:
        conditions.append(Transaction.transaction_date >= filters.start_date)
    if filters.end_date is not None:
        conditions.append(Transaction.transaction_date <= filters.end_date)
    if filters.status is not None:
        conditions.append(Transaction.status == filters.status)

    base_query = select(Transaction).where(*conditions)

    total_items = int(db.scalar(select(func.count()).select_from(base_query.subquery())) or 0)

    items = list(
        db.scalars(
            base_query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
    )

    return items, total_items


def get_transaction_for_user(
    db: Session, transaction_id: uuid.UUID, user_id: uuid.UUID
) -> Transaction | None:
    return db.scalar(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    )


def add_transaction(db: Session, transaction: Transaction) -> None:
    db.add(transaction)
    db.flush()


def sum_amounts(
    db: Session,
    user_id: uuid.UUID,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[Decimal, Decimal]:
    """Return (total_income, total_expenses) from valid ACTIVE transactions.

    Future-dated transactions are included only when end_date explicitly
    extends beyond today (FINANCIAL_RULES.md §9 default: balance uses
    transaction_date <= today).
    """
    conditions = [
        Transaction.user_id == user_id,
        Transaction.status == "ACTIVE",
    ]

    # Default behavior (FINANCIAL_RULES.md §9): balance covers movements up to
    # today. An explicit end_date beyond today opts into including planned
    # future movements (e.g. report ranges).
    effective_end = end_date if end_date is not None else date.today()

    if start_date is not None:
        conditions.append(Transaction.transaction_date >= start_date)
    conditions.append(Transaction.transaction_date <= effective_end)

    rows = db.execute(
        select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(*conditions)
        .group_by(Transaction.type)
    ).all()

    totals: dict[str, Decimal] = {row[0]: row[1] for row in rows}
    return totals.get("INCOME", Decimal(0)), totals.get("EXPENSE", Decimal(0))
