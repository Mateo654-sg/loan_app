"""Payment allocation engine (PAYMENT_RULES.md §11–30).

Deterministic allocation implemented exactly per the official formula
(PAYMENT_RULES.md §17):

    late_fee_paid   = MIN(remaining_payment, outstanding_late_fees)
    interest_paid   = MIN(rest_1, outstanding_interest)
    principal_paid  = MIN(rest_2, outstanding_principal)

Order within each installment: Late fee -> Interest -> Principal (§11).
Installments are consumed oldest-outstanding-first (§21–22); a single
payment may satisfy multiple installments (§23–24). Any amount that
cannot be applied becomes explicit customer CREDIT, never silent loss
(§26–28, §30).

Invariants enforced here (§18–19):
    payment_amount = sum(allocations) + credit
    no component is ever reduced below zero
"""
from dataclasses import dataclass, field
from decimal import Decimal

from pydantic import BaseModel, field_validator


class OutstandingInstallment(BaseModel):
    """Outstanding components of one installment, oldest first in input order."""

    installment_id: str  # opaque reference; persistence layer maps to UUID
    late_fee_outstanding: Decimal = Decimal(0)
    interest_outstanding: Decimal = Decimal(0)
    principal_outstanding: Decimal = Decimal(0)

    @field_validator("late_fee_outstanding", "interest_outstanding", "principal_outstanding")
    @classmethod
    def validate_non_negative(cls, value: Decimal) -> Decimal:
        if value < 0:
            raise ValueError("outstanding components cannot be negative")
        return value


@dataclass(frozen=True)
class InstallmentAllocation:
    installment_id: str
    late_fee_amount: Decimal
    interest_amount: Decimal
    principal_amount: Decimal

    @property
    def total(self) -> Decimal:
        return self.late_fee_amount + self.interest_amount + self.principal_amount


@dataclass(frozen=True)
class AllocationResult:
    allocations: list[InstallmentAllocation] = field(default_factory=list)
    credit: Decimal = Decimal(0)

    @property
    def allocated_total(self) -> Decimal:
        return sum((allocation.total for allocation in self.allocations), Decimal(0))


def _allocate_within_installment(
    installment_id: str,
    installment: OutstandingInstallment,
    available: Decimal,
) -> tuple[InstallmentAllocation, Decimal]:
    remaining = available

    late_fee_amount = min(remaining, installment.late_fee_outstanding)
    remaining -= late_fee_amount

    interest_amount = min(remaining, installment.interest_outstanding)
    remaining -= interest_amount

    principal_amount = min(remaining, installment.principal_outstanding)
    remaining -= principal_amount

    allocation = InstallmentAllocation(
        installment_id=installment_id,
        late_fee_amount=late_fee_amount,
        interest_amount=interest_amount,
        principal_amount=principal_amount,
    )
    return allocation, remaining


def allocate_payment(
    amount: Decimal,
    installments: list[OutstandingInstallment],
) -> AllocationResult:
    """Allocate a payment across ordered outstanding installments."""
    if amount <= Decimal(0):
        raise ValueError("payment amount must be greater than zero")

    remaining_payment = amount
    allocations: list[InstallmentAllocation] = []

    for installment in installments:
        if remaining_payment <= Decimal(0):
            break

        # Skip fully settled obligations without producing empty rows.
        has_outstanding = (
            installment.late_fee_outstanding > 0
            or installment.interest_outstanding > 0
            or installment.principal_outstanding > 0
        )
        if not has_outstanding:
            continue

        allocation, remaining_payment = _allocate_within_installment(
            installment.installment_id, installment, remaining_payment
        )
        allocations.append(allocation)

    credit = remaining_payment

    result = AllocationResult(allocations=allocations, credit=credit)

    # Invariant §18/§30: every cent of the payment is explained.
    if result.allocated_total + credit != amount:
        raise ArithmeticError("payment allocation does not reconcile with the paid amount")

    return result


__all__ = [
    "AllocationResult",
    "InstallmentAllocation",
    "OutstandingInstallment",
    "allocate_payment",
]
