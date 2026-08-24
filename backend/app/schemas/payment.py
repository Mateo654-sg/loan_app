from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _max_two_decimals(value: Decimal) -> Decimal:
    if -value.as_tuple().exponent > 2:
        raise ValueError("supports at most 2 decimal places")
    return value


class PaymentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    amount: Decimal = Field(gt=0)
    payment_date: date
    payment_method: Literal["CASH", "BANK_TRANSFER", "CARD", "OTHER"]
    installment_id: UUID | None = None  # optional explicit target (PAYMENT_RULES §20)
    reference: str | None = Field(default=None, max_length=255)
    notes: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        return _max_two_decimals(value)


class ReversalRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    reason: str = Field(min_length=1, max_length=1000)


class PaymentAllocationResponse(BaseModel):
    late_fee: str
    interest: str
    principal: str
    credit: str


class PaymentResponse(BaseModel):
    id: UUID
    loan_id: UUID
    client_id: UUID
    amount: str
    payment_date: date
    payment_method: str
    reference: str | None
    notes: str | None
    status: str
    allocation: PaymentAllocationResponse
    created_at: datetime

    @classmethod
    def from_model(cls, payment, allocations: list) -> "PaymentResponse":  # type: ignore[no-untyped-def]
        from app.schemas.common import format_money

        totals = {
            "late_fee": Decimal(0),
            "interest": Decimal(0),
            "principal": Decimal(0),
        }
        for allocation in allocations:
            totals["late_fee"] += allocation.late_fee_amount
            totals["interest"] += allocation.interest_amount
            totals["principal"] += allocation.principal_amount

        return cls(
            id=payment.id,
            loan_id=payment.loan_id,
            client_id=payment.client_id,
            amount=format_money(payment.amount),
            payment_date=payment.payment_date,
            payment_method=payment.payment_method,
            reference=payment.reference,
            notes=payment.notes,
            status=payment.status,
            allocation=PaymentAllocationResponse(
                late_fee=format_money(totals["late_fee"]),
                interest=format_money(totals["interest"]),
                principal=format_money(totals["principal"]),
                credit=format_money(payment.credit_amount),
            ),
            created_at=payment.created_at,
        )
