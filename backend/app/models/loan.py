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
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

MONEY_PRECISION = Numeric(19, 4)
RATE_PRECISION = Numeric(12, 8)


def utc_now() -> datetime:
    return datetime.now(UTC)


class Loan(Base):
    """A personal loan (DATABASE.md §20–23).

    Financial components (principal/interest/late fees) live on the
    installments and payments; this table stores the contracted
    configuration plus status. Loans are cancelled, never deleted
    (LOAN_RULES.md §48).
    """

    __tablename__ = "loans"
    __table_args__ = (
        CheckConstraint("principal > 0", name="ck_loans_principal_positive"),
        CheckConstraint("number_of_installments > 0", name="ck_loans_installments_positive"),
        Index("ix_loans_user_status", "user_id", "status"),
        Index("ix_loans_client_status", "client_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
    )
    principal: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    interest_rate: Mapped[Decimal] = mapped_column(RATE_PRECISION, nullable=False)
    interest_period: Mapped[str] = mapped_column(String(16), nullable=False)
    amortization_type: Mapped[str] = mapped_column(String(32), nullable=False)
    payment_frequency: Mapped[str] = mapped_column(String(16), nullable=False)
    number_of_installments: Mapped[int] = mapped_column(nullable=False)
    first_due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE")
    guarantee: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class LateFeeConfiguration(Base):
    """Per-loan late fee configuration (DATABASE.md §33)."""

    __tablename__ = "late_fee_configurations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    loan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("loans.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    value: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=0)
    grace_period_days: Mapped[int] = mapped_column(nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class LoanInstallment(Base):
    """Persisted amortization schedule entry (DATABASE.md §24–27).

    The generated schedule is the basis for payment tracking; paid
    components start at zero and are only modified by posted payments.
    remaining_balance is maintained by the payment engine (Phase 7+);
    at creation it equals total_due.
    """

    __tablename__ = "loan_installments"
    __table_args__ = (
        CheckConstraint("installment_number > 0", name="ck_installments_number_positive"),
        CheckConstraint("principal_due >= 0", name="ck_installments_principal_due"),
        CheckConstraint("interest_due >= 0", name="ck_installments_interest_due"),
        CheckConstraint("late_fee_due >= 0", name="ck_installments_late_fee_due"),
        CheckConstraint("principal_paid >= 0", name="ck_installments_principal_paid"),
        CheckConstraint("interest_paid >= 0", name="ck_installments_interest_paid"),
        CheckConstraint("late_fee_paid >= 0", name="ck_installments_late_fee_paid"),
        CheckConstraint("remaining_balance >= 0", name="ck_installments_remaining"),
        # Persisted status per DATABASE.md §25; recomputed by the backend.
        CheckConstraint(
            "status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')",
            name="ck_installments_status",
        ),
        Index("ix_loan_installments_loan_due", "loan_id", "due_date"),
        Index("ix_loan_installments_status_due", "status", "due_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    loan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("loans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    installment_number: Mapped[int] = mapped_column(nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    principal_due: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    interest_due: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    late_fee_due: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False, default=0)
    total_due: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)

    principal_paid: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False, default=0)
    interest_paid: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False, default=0)
    late_fee_paid: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False, default=0)

    remaining_balance: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="PENDING")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


__all__ = ["LateFeeConfiguration", "Loan", "LoanInstallment"]
