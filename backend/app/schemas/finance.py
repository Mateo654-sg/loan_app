from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import format_money

TransactionType = Literal["INCOME", "EXPENSE"]
PaymentMethod = Literal["CASH", "BANK_TRANSFER", "CARD", "OTHER"]


# ---------- Categories ----------


class CategoryCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    type: TransactionType


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    is_active: bool


# ---------- Transactions ----------


class TransactionCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    type: TransactionType
    amount: Decimal = Field(gt=0)
    category_id: UUID
    transaction_date: date
    description: str | None = Field(default=None, max_length=255)
    payment_method: PaymentMethod | None = None
    notes: str | None = None

    @field_validator("amount")
    @classmethod
    def reject_more_than_two_decimals(cls, value: Decimal) -> Decimal:
        # Monetary inputs are accepted with up to 2 decimals (NUMERIC(19,4) storage).
        if -value.as_tuple().exponent > 2:
            raise ValueError("Amount supports at most 2 decimal places")
        return value


class TransactionUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    amount: Decimal | None = Field(default=None, gt=0)
    category_id: UUID | None = None
    transaction_date: date | None = None
    description: str | None = Field(default=None, max_length=255)
    payment_method: PaymentMethod | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: UUID
    type: str
    amount: str
    category_id: UUID
    transaction_date: date
    description: str | None
    payment_method: str | None
    notes: str | None
    status: str
    created_at: datetime

    @classmethod
    def from_model(cls, transaction) -> "TransactionResponse":  # type: ignore[no-untyped-def]
        return cls(
            id=transaction.id,
            type=transaction.type,
            amount=format_money(transaction.amount),
            category_id=transaction.category_id,
            transaction_date=transaction.transaction_date,
            description=transaction.description,
            payment_method=transaction.payment_method,
            notes=transaction.notes,
            status=transaction.status,
            created_at=transaction.created_at,
        )


class FinanceSummaryResponse(BaseModel):
    currency: str
    total_income: str
    total_expenses: str
    balance: str

    @classmethod
    def build(cls, *, currency: str, income: Decimal, expenses: Decimal) -> "FinanceSummaryResponse":
        return cls(
            currency=currency,
            total_income=format_money(income),
            total_expenses=format_money(expenses),
            balance=format_money(income - expenses),
        )


# ---------- Goals ----------


class GoalCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    target_amount: Decimal = Field(gt=0)
    target_date: date | None = None
    description: str | None = None

    @field_validator("target_amount")
    @classmethod
    def max_two_decimals(cls, value: Decimal) -> Decimal:
        if -value.as_tuple().exponent > 2:
            raise ValueError("Amount supports at most 2 decimal places")
        return value


class GoalUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    target_amount: Decimal | None = Field(default=None, gt=0)
    target_date: date | None = None
    description: str | None = None


class GoalResponse(BaseModel):
    id: UUID
    name: str
    target_amount: str
    current_amount: str
    remaining_amount: str
    progress_percent: int
    target_date: date | None
    description: str | None
    status: str

    @classmethod
    def from_model(cls, goal, current_amount: Decimal) -> "GoalResponse":  # type: ignore[no-untyped-def]
        # Progress is capped at 100% for display; the actual accumulated
        # amount stays accurate (FINANCIAL_RULES.md §20).
        raw_progress = (current_amount / goal.target_amount * 100) if goal.target_amount else Decimal(0)
        progress_percent = min(int(raw_progress), 100)

        return cls(
            id=goal.id,
            name=goal.name,
            target_amount=format_money(goal.target_amount),
            current_amount=format_money(current_amount),
            remaining_amount=format_money(max(goal.target_amount - current_amount, Decimal(0))),
            progress_percent=progress_percent,
            target_date=goal.target_date,
            description=goal.description,
            status=goal.status,
        )


class ContributionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    contribution_date: date
    description: str | None = Field(default=None, max_length=255)


class ContributionResponse(BaseModel):
    id: UUID
    goal_id: UUID
    amount: str
    contribution_date: date
    description: str | None
    status: str

    @classmethod
    def from_model(cls, contribution) -> "ContributionResponse":  # type: ignore[no-untyped-def]
        return cls(
            id=contribution.id,
            goal_id=contribution.goal_id,
            amount=format_money(contribution.amount),
            contribution_date=contribution.contribution_date,
            description=contribution.description,
            status=contribution.status,
        )
