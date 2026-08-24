"""Late fee tests (TESTING.md §12): disabled, grace period, fixed amount,
percentage and daily percentage — always separate from ordinary interest."""

from decimal import Decimal

import pytest

from app.calculators.late_fees import LateFeeConfig, LateFeeType, calculate_late_fee

BASE = Decimal("500000")


def test_disabled_configuration_always_zero() -> None:
    config = LateFeeConfig(enabled=False, type=LateFeeType.FIXED_AMOUNT, value=Decimal("10000"))
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=30) == Decimal("0.00")


def test_fixed_amount_applied_once_after_grace() -> None:
    config = LateFeeConfig(
        enabled=True, type=LateFeeType.FIXED_AMOUNT, value=Decimal("10000"), grace_period_days=2
    )

    assert calculate_late_fee(config, base_amount=BASE, days_overdue=2) == Decimal("0.00")
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=3) == Decimal("10000.00")
    # Not repeated per extra day in v1.0 (LOAN_RULES.md §34).
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=20) == Decimal("10000.00")


def test_percentage_uses_explicit_outstanding_principal_base() -> None:
    """LOAN_RULES.md §35: 5% of a 500,000 base = 25,000."""
    config = LateFeeConfig(enabled=True, type=LateFeeType.PERCENTAGE, value=Decimal("5"))

    assert calculate_late_fee(config, base_amount=BASE, days_overdue=1) == Decimal("25000.00")


def test_daily_percentage_multiplies_by_eligible_days() -> None:
    """LOAN_RULES.md §36: 500,000 x 0.1% x 5 = 2,500 (no compounding)."""
    config = LateFeeConfig(enabled=True, type=LateFeeType.DAILY_PERCENTAGE, value=Decimal("0.1"))

    assert calculate_late_fee(config, base_amount=BASE, days_overdue=5) == Decimal("2500.00")
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=10) == Decimal("5000.00")


def test_grace_period_excluded_from_daily_eligible_days() -> None:
    config = LateFeeConfig(
        enabled=True,
        type=LateFeeType.DAILY_PERCENTAGE,
        value=Decimal("0.1"),
        grace_period_days=3,
    )

    # Within grace: overdue but no fee (OVERDUE ≠ LATE FEE APPLIED, §63–64).
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=3) == Decimal("0.00")
    # 2 eligible days beyond the 3-day grace window.
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=5) == Decimal("1000.00")


def test_zero_days_or_non_overdue_never_produces_fee() -> None:
    config = LateFeeConfig(enabled=True, type=LateFeeType.FIXED_AMOUNT, value=Decimal("5000"))

    assert calculate_late_fee(config, base_amount=BASE, days_overdue=0) == Decimal("0.00")


@pytest.mark.parametrize("value", ["-1"])
def test_negative_value_rejected(value: str) -> None:
    with pytest.raises(Exception):
        LateFeeConfig(enabled=True, type=LateFeeType.PERCENTAGE, value=Decimal(value))


def test_invalid_type_without_enabled_is_safe() -> None:
    config = LateFeeConfig()
    assert calculate_late_fee(config, base_amount=BASE, days_overdue=99) == Decimal("0.00")
