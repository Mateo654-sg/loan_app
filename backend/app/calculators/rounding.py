"""Deterministic monetary rounding (LOAN_RULES.md §51).

All monetary values produced by the financial engine are quantized to two
decimal places with ROUND_HALF_UP. No float ever enters these functions.
"""
from decimal import ROUND_HALF_UP, Decimal

TWO_PLACES = Decimal("0.01")


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def to_rate_fraction(rate_percent: Decimal) -> Decimal:
    """Convert a percentage rate (e.g. Decimal('10') = 10%) into a fraction."""
    return rate_percent / Decimal(100)
