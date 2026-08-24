"""Interest calculation (LOAN_RULES.md §7–16).

The explicitly configured interest period IS the calculation period for
v1.0 (LOAN_RULES.md §16): no annual-to-period conversion is performed.

interest = outstanding_principal_for_the_period x periodic_rate
"""
from decimal import Decimal

from app.calculators.rounding import quantize_money, to_rate_fraction


def calculate_period_interest(
    outstanding_principal: Decimal, rate_percent: Decimal
) -> Decimal:
    """Quantized interest for one period on the given outstanding principal."""
    if outstanding_principal < Decimal(0):
        raise ValueError("outstanding principal cannot be negative")
    if rate_percent < Decimal(0):
        raise ValueError("interest rate cannot be negative")

    interest = outstanding_principal * to_rate_fraction(rate_percent)
    return quantize_money(interest)


__all__ = ["calculate_period_interest"]
