"""Due-date generation engine (LOAN_RULES.md §17–24, TESTING.md §10–11).

Deterministic rules implemented here:

* ONCE        -> the single first due date.
* DAILY       -> +1 day per installment.
* WEEKLY      -> +7 days.
* BIWEEKLY    -> +14 days.
* MONTHLY     -> calendar months preserving the anchor day; if the target
                month has no such day, use its last valid day
                (Jan 31 -> Feb 28, or Feb 29 in a leap year).
* CUSTOM      -> explicit list of dates supplied by the caller; it becomes
                the source of truth for installment dates.

No string manipulation is used for date arithmetic (AI_MASTER_PROMPT §19).
"""
import calendar
from datetime import date, timedelta
from enum import Enum

from pydantic import BaseModel, field_validator


class PaymentFrequency(str, Enum):
    ONCE = "ONCE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    CUSTOM = "CUSTOM"


class DateEngineError(ValueError):
    """Raised for invalid schedule configurations."""


class ScheduleDatesInput(BaseModel):
    frequency: PaymentFrequency
    number_of_installments: int
    first_due_date: date
    custom_dates: list[date] | None = None

    @field_validator("number_of_installments")
    @classmethod
    def validate_count(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("number_of_installments must be greater than zero")
        return value


def _add_months(anchor: date, months: int) -> date:
    month_index = anchor.month - 1 + months
    year = anchor.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(anchor.day, last_day))


_STEP_BY_FREQUENCY: dict[PaymentFrequency, timedelta] = {
    PaymentFrequency.DAILY: timedelta(days=1),
    PaymentFrequency.WEEKLY: timedelta(days=7),
    PaymentFrequency.BIWEEKLY: timedelta(days=14),
}


def generate_due_dates(config: ScheduleDatesInput) -> list[date]:
    count = config.number_of_installments

    if config.frequency == PaymentFrequency.ONCE and count != 1:
        raise DateEngineError("ONCE frequency requires exactly one installment")

    if config.frequency == PaymentFrequency.CUSTOM:
        if not config.custom_dates or len(config.custom_dates) != count:
            raise DateEngineError(
                "CUSTOM frequency requires custom_dates matching number_of_installments"
            )
        return list(config.custom_dates)

    first = config.first_due_date

    if config.frequency == PaymentFrequency.ONCE:
        return [first]

    step = _STEP_BY_FREQUENCY.get(config.frequency)
    if step is not None:
        return [first + step * index for index in range(count)]

    # MONTHLY: anchor on the first due date's day-of-month with clamping.
    return [_add_months(first, index) for index in range(count)]


def days_overdue(due_date: date, business_date: date) -> int:
    """Days past due; zero when not overdue (LOAN_RULES.md §31)."""
    delta = (business_date - due_date).days
    return max(delta, 0)


__all__ = [
    "DateEngineError",
    "PaymentFrequency",
    "ScheduleDatesInput",
    "days_overdue",
    "generate_due_dates",
]