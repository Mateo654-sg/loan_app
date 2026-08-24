import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy import text as sa_text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

MONEY_PRECISION = Numeric(19, 4)


def utc_now() -> datetime:
    return datetime.now(UTC)


class Category(Base):
    """Personal finance category (DATABASE.md §10–12).

    Categories are never physically deleted once they have historical
    transactions: they are deactivated instead (FINANCIAL_RULES.md §12).
    Case-insensitive uniqueness per user/type is enforced by a functional
    unique index created in the Alembic migration plus a service-level check.
    """

    __tablename__ = "categories"
    __table_args__ = (
        Index(
            "uq_categories_user_type_lower_name",
            "user_id",
            "type",
            sa_text("LOWER(name)"),
            unique=True,
            postgresql_where=sa_text("is_active"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)  # INCOME | EXPENSE
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class Transaction(Base):
    """Personal income/expense movement (DATABASE.md §12–14).

    amount > 0 always; the direction is given by `type` (FINANCIAL_RULES §6).
    Cancelled transactions remain persisted and excluded from balances.
    """

    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        CheckConstraint("type IN ('INCOME', 'EXPENSE')", name="ck_transactions_type"),
        CheckConstraint("status IN ('ACTIVE', 'CANCELLED')", name="ck_transactions_status"),
        CheckConstraint(
            "payment_method IS NULL OR payment_method IN "
            "('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER')",
            name="ck_transactions_payment_method",
        ),
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_type_date", "user_id", "type", "transaction_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(String(16), nullable=False)  # INCOME | EXPENSE
    amount: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Origin of system-generated transactions (e.g. collected interest from a
    # loan payment). Null for user-created movements. Enables reversal
    # traceability without double counting (FINANCIAL_RULES §26–31).
    source_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )
