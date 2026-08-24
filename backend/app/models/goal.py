import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import (
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


def utc_now() -> datetime:
    return datetime.now(UTC)


class FinancialGoal(Base):
    """Financial goal (DATABASE.md §15).

    current_amount is NOT stored: it is derived from active contributions
    (DATABASE.md §17, FINANCIAL_RULES.md §21).
    """

    __tablename__ = "financial_goals"
    __table_args__ = (
        CheckConstraint("target_amount > 0", name="ck_goals_target_positive"),
        CheckConstraint(
            "status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')", name="ck_goals_status"
        ),
        Index("ix_financial_goals_user_status", "user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class GoalContribution(Base):
    """Money allocated toward a goal (DATABASE.md §16).

    Contributions are historical records: they are reversed (CANCELLED),
    never deleted (FINANCIAL_RULES.md §21–22).
    """

    __tablename__ = "goal_contributions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_contributions_amount_positive"),
        CheckConstraint("status IN ('ACTIVE', 'CANCELLED')", name="ck_contributions_status"),
        Index("ix_goal_contributions_goal_date", "goal_id", "contribution_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("financial_goals.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(MONEY_PRECISION, nullable=False)
    contribution_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )
