"""Late fee calculation (LOAN_RULES.md §32–37).

Rules implemented:

* Late fees are independent from ordinary interest and never compound
  (§37): the fee base never includes other late fees.
* PERCENTAGE base = outstanding principal of the obligation (§35 v1.0
  recommendation, made explicit here).
* DAILY_PERCENTAGE = base x daily_rate x eligible_overdue_days (§36).
* Grace period: no fee before grace_period_days have elapsed past due;
  eligible days for daily fees are those beyond the grace window (§32,
  §63–64). OVERDUE ≠ LATE FEE APPLIED.

Fees are applied once per overdue installment in v1.0; repeated
application would require an explicit future rule change (§34).
"""
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, field_validator

from app.calculators.rounding import quantize_money, to_rate_fraction


class LateFeeType(str, Enum):
    FIXED_AMOUNT = "FIXED_AMOUNT"
    PERCENTAGE = "PERCENTAGE"
    DAILY_PERCENTAGE = "DAILY_PERCENTAGE"


class LateFeeConfig(BaseModel):
    enabled: bool = False
    type: LateFeeType | None = None
    value: Decimal = Decimal(0)
    grace_period_days: int = 0

    @field_validator("value")
    @classmethod
    def validate_value(cls, value: Decimal) -> Decimal:
        if value < 0:
            raise ValueError("late fee value cannot be negative")
        return value

    @field_validator("grace_period_days")
    @classmethod
    def validate_grace(cls, value: int) -> int:
        if value < 0:
            raise ValueError("grace period cannot be negative")
        return value


def calculate_late_fee(
    config: LateFeeConfig, *, base_amount: Decimal, days_overdue: int
) -> Decimal:
    """Quantized late fee for an obligation with the given elapsed days."""
    if not config.enabled or config.type is None:
        return Decimal("0.00")

    if days_overdue <= config.grace_period_days:
        return Decimal("0.00")

    if config.type == LateFeeType.FIXED_AMOUNT:
        return quantize_money(config.value)

    if config.type == LateFeeType.PERCENTAGE:
        return quantize_money(base_amount * to_rate_fraction(config.value))

    # DAILY_PERCENTAGE: one day of fee per day beyond the grace window.
    eligible_days = days_overdue - config.grace_period_days
    return quantize_money(base_amount * to_rate_fraction(config.value) * eligible_days)


__all__ = ["LateFeeConfig", "LateFeeType", "calculate_late_fee"]
