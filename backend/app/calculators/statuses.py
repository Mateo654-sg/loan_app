"""Installment status derivation (LOAN_RULES.md §28–31).

The backend is the only authority for installment status; the frontend
must display, never decide (PRODUCT_SPECIFICATION.md §24).

    outstanding = (principal_due - principal_paid)
                + (interest_due - interest_paid)
                + (late_fee_due - late_fee_paid)

    outstanding <= 0                      -> PAID
    business_date > due_date              -> OVERDUE (+days_overdue)
    any paid component > 0                -> PARTIAL
    otherwise                             -> PENDING

CANCELLED is a persistence-level state and is never derived here.
"""
from datetime import date
from decimal import Decimal
from enum import Enum

from app.calculators.dates import days_overdue


class InstallmentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


def outstanding_amount(
    *,
    principal_due: Decimal,
    interest_due: Decimal,
    late_fee_due: Decimal,
    principal_paid: Decimal,
    interest_paid: Decimal,
    late_fee_paid: Decimal,
) -> Decimal:
    result = (
        (principal_due - principal_paid)
        + (interest_due - interest_paid)
        + (late_fee_due - late_fee_paid)
    )
    return max(result, Decimal("0.00"))


def derive_installment_status(
    *,
    due_date: date,
    principal_due: Decimal,
    interest_due: Decimal,
    late_fee_due: Decimal,
    principal_paid: Decimal,
    interest_paid: Decimal,
    late_fee_paid: Decimal,
    business_date: date,
) -> tuple[InstallmentStatus, int]:
    """Return (status, days_overdue). days_overdue is 0 unless OVERDUE."""
    remaining = outstanding_amount(
        principal_due=principal_due,
        interest_due=interest_due,
        late_fee_due=late_fee_due,
        principal_paid=principal_paid,
        interest_paid=interest_paid,
        late_fee_paid=late_fee_paid,
    )

    if remaining <= Decimal(0):
        return InstallmentStatus.PAID, 0

    overdue_days = days_overdue(due_date, business_date)
    if overdue_days > 0:
        return InstallmentStatus.OVERDUE, overdue_days

    has_partial_payment = any(
        component > Decimal(0)
        for component in (principal_paid, interest_paid, late_fee_paid)
    )
    if has_partial_payment:
        return InstallmentStatus.PARTIAL, 0

    return InstallmentStatus.PENDING, 0


__all__ = ["InstallmentStatus", "derive_installment_status", "outstanding_amount"]
