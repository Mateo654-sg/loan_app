"""Amortization schedule generators (LOAN_RULES.md §12–15, §49–52).

Both generators are deterministic: identical inputs always produce an
identical schedule (LOAN_RULES.md §50). Components are exact Decimals;
the final installment absorbs any rounding difference so that

    sum(principal components) == original principal
and the loan can always reach outstanding_principal = 0 when fully paid.

Late fees are NOT part of schedule generation: they are calculated
separately when an installment becomes eligible (LOAN_RULES.md §67).
"""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, localcontext
from enum import Enum

from pydantic import BaseModel, field_validator

from app.calculators.dates import PaymentFrequency, ScheduleDatesInput, generate_due_dates
from app.calculators.interest import calculate_period_interest
from app.calculators.rounding import quantize_money, to_rate_fraction


class AmortizationType(str, Enum):
    FIXED_PRINCIPAL = "FIXED_PRINCIPAL"
    FRENCH = "FRENCH"


@dataclass(frozen=True)
class InstallmentComponent:
    """A generated (not yet persisted) installment of the schedule."""

    installment_number: int
    due_date: date
    principal_due: Decimal
    interest_due: Decimal
    total_due: Decimal
    remaining_balance: Decimal  # outstanding principal AFTER this installment


class ScheduleInput(BaseModel):
    principal: Decimal
    rate_percent: Decimal  # e.g. Decimal('10') means 10% per interest period
    amortization_type: AmortizationType
    dates_config: ScheduleDatesInput

    @field_validator("principal")
    @classmethod
    def validate_principal(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("principal must be greater than zero")
        return value

    @field_validator("rate_percent")
    @classmethod
    def validate_rate(cls, value: Decimal) -> Decimal:
        if value < 0:
            raise ValueError("interest rate cannot be negative")
        return value


def generate_schedule(config: ScheduleInput) -> list[InstallmentComponent]:
    due_dates = generate_due_dates(config.dates_config)
    count = len(due_dates)

    if config.amortization_type == AmortizationType.FIXED_PRINCIPAL:
        return _fixed_principal_schedule(config.principal, config.rate_percent, due_dates)
    return _french_schedule(config.principal, config.rate_percent, due_dates)


def _validate_count(count: int) -> None:
    if count <= 0:
        raise ValueError("number_of_installments must be greater than zero")


# ---------- Fixed principal (LOAN_RULES.md §12–13, §61) ----------


def _fixed_principal_schedule(
    principal: Decimal, rate_percent: Decimal, due_dates: list[date]
) -> list[InstallmentComponent]:
    count = len(due_dates)
    base_component = quantize_money(principal / count)

    rows: list[InstallmentComponent] = []
    remaining = principal

    for number, due_date in enumerate(due_dates, start=1):
        is_final = number == count
        principal_component = (
            base_component if not is_final else quantize_money(remaining)
        )
        interest = calculate_period_interest(remaining, rate_percent)
        total = principal_component + interest
        remaining = remaining - principal_component

        rows.append(
            InstallmentComponent(
                installment_number=number,
                due_date=due_date,
                principal_due=principal_component,
                interest_due=interest,
                total_due=total,
                remaining_balance=remaining,
            )
        )

    _assert_reconciles(rows, principal)
    return rows


# ---------- French amortization (LOAN_RULES.md §14–15) ----------


def _french_periodic_payment(
    principal: Decimal, rate_percent: Decimal, count: int
) -> Decimal:
    """P x [r(1+r)^n] / [(1+r)^n - 1] with high internal precision."""
    if rate_percent == Decimal(0):
        return quantize_money(principal / count)

    rate = to_rate_fraction(rate_percent)
    with localcontext() as context:
        context.prec = 40
        factor = (Decimal(1) + rate) ** count
        payment = principal * (rate * factor) / (factor - Decimal(1))
    return quantize_money(payment)


def _french_schedule(
    principal: Decimal, rate_percent: Decimal, due_dates: list[date]
) -> list[InstallmentComponent]:
    count = len(due_dates)
    payment = _french_periodic_payment(principal, rate_percent, count)

    rows: list[InstallmentComponent] = []
    remaining = principal

    for number, due_date in enumerate(due_dates, start=1):
        is_final = number == count
        interest = calculate_period_interest(remaining, rate_percent)

        if is_final:
            # Final installment absorbs any rounding difference so the
            # balance reaches exactly zero (LOAN_RULES.md §52).
            principal_component = quantize_money(remaining)
            total = principal_component + interest
        else:
            principal_component = payment - interest
            total = payment

        remaining = remaining - principal_component

        rows.append(
            InstallmentComponent(
                installment_number=number,
                due_date=due_date,
                principal_due=principal_component,
                interest_due=interest,
                total_due=total,
                remaining_balance=remaining,
            )
        )

    _assert_reconciles(rows, principal)
    return rows


# ---------- Invariants (LOAN_RULES.md §60) ----------


def _assert_reconciles(rows: list[InstallmentComponent], principal: Decimal) -> None:
    total_principal = sum((row.principal_due for row in rows), Decimal(0))
    if total_principal != principal:
        raise ArithmeticError("schedule principal does not reconcile")

    if rows and rows[-1].remaining_balance != Decimal(0):
        raise ArithmeticError("final remaining balance must be zero")

    for row in rows:
        if row.principal_due < 0 or row.interest_due < 0 or row.total_due < 0:
            raise ArithmeticError("schedule produced a negative component")


__all__ = [
    "AmortizationType",
    "InstallmentComponent",
    "PaymentFrequency",
    "ScheduleInput",
    "_french_periodic_payment",
    "generate_schedule",
]
