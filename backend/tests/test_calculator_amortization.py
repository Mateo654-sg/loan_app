"""Amortization & interest tests (TESTING.md §7–9).

Expected values come from hand-verified examples in LOAN_RULES.md §61
(fixed principal) and the French payment formula §14."""

from datetime import date
from decimal import Decimal

import pytest

from app.calculators.amortization import (
    AmortizationType,
    ScheduleInput,
    _french_periodic_payment,
    generate_schedule,
)
from app.calculators.dates import PaymentFrequency, ScheduleDatesInput


def _config(
    principal: str,
    rate: str,
    amortization: AmortizationType,
    count: int,
    frequency: PaymentFrequency = PaymentFrequency.MONTHLY,
    first_due: date | None = None,
) -> ScheduleInput:
    return ScheduleInput(
        principal=Decimal(principal),
        rate_percent=Decimal(rate),
        amortization_type=amortization,
        dates_config=ScheduleDatesInput(
            frequency=frequency,
            number_of_installments=count,
            first_due_date=first_due or date(2026, 8, 21),
        ),
    )


# ---------- fixed principal ----------


def test_fixed_principal_single_installment() -> None:
    rows = generate_schedule(_config("1000000", "10", AmortizationType.FIXED_PRINCIPAL, 1))

    assert len(rows) == 1
    assert rows[0].principal_due == Decimal("1000000.00")
    # 10% of the outstanding principal for the period (LOAN_RULES §13).
    assert rows[0].interest_due == Decimal("100000.00")
    assert rows[0].total_due == Decimal("1100000.00")
    assert rows[0].remaining_balance == Decimal("0.00")


def test_fixed_principal_matches_official_example_1m_over_10() -> None:
    """LOAN_RULES.md §61: principal 1,000,000 at 10% monthly over 10 months."""
    rows = generate_schedule(_config("1000000", "10", AmortizationType.FIXED_PRINCIPAL, 10))

    assert len(rows) == 10
    assert rows[0].principal_due == Decimal("100000.00")
    assert rows[0].interest_due == Decimal("100000.00")
    assert rows[0].total_due == Decimal("200000.00")
    assert rows[0].remaining_balance == Decimal("900000.00")

    assert rows[1].principal_due == Decimal("100000.00")
    assert rows[1].interest_due == Decimal("90000.00")
    assert rows[1].total_due == Decimal("190000.00")
    assert rows[1].remaining_balance == Decimal("800000.00")

    # Interest decreases as principal is repaid; final balance is zero.
    interests = [row.interest_due for row in rows]
    assert interests == sorted(interests, reverse=True)
    assert rows[-1].remaining_balance == Decimal("0.00")


def test_fixed_principal_final_installment_absorbs_rounding() -> None:
    # 100 / 3 rounds HALF_UP to 33.33 per component; the final installment
    # absorbs the remaining difference deterministically.
    rows = generate_schedule(_config("100", "0", AmortizationType.FIXED_PRINCIPAL, 3))

    principals = [row.principal_due for row in rows]
    assert principals[0] == principals[1] == Decimal("33.33")
    assert principals[2] == Decimal("33.34")  # 100 - 33.33*2
    assert sum(principals) == Decimal("100.00")
    assert all(row.remaining_balance >= 0 for row in rows)
    assert rows[-1].remaining_balance == Decimal("0.00")


def test_two_installment_fixed_principal() -> None:
    rows = generate_schedule(
        _config("500000", "5", AmortizationType.FIXED_PRINCIPAL, 2, first_due=date(2026, 9, 21))
    )
    assert rows[0].principal_due == rows[1].principal_due == Decimal("250000.00")
    assert rows[0].interest_due == Decimal("25000.00")
    assert rows[1].interest_due == Decimal("12500.00")


def test_zero_rate_fixed_principal_totals_equal_principal() -> None:
    rows = generate_schedule(_config("1200", "0", AmortizationType.FIXED_PRINCIPAL, 12))
    assert sum(row.total_due for row in rows) == Decimal("1200.00")


# ---------- french amortization ----------


def test_french_single_installment() -> None:
    rows = generate_schedule(_config("100000", "10", AmortizationType.FRENCH, 1))

    # One period: interest on full principal, principal covers the rest.
    assert rows[0].interest_due == Decimal("10000.00")
    assert rows[0].principal_due == Decimal("100000.00")
    assert rows[0].total_due == Decimal("110000.00")


def test_french_three_installments_reconciles() -> None:
    rows = generate_schedule(_config("300000", "5", AmortizationType.FRENCH, 3))

    assert [row.installment_number for row in rows] == [1, 2, 3]
    assert sum(row.principal_due for row in rows) == Decimal("300000.00")
    assert rows[-1].remaining_balance == Decimal("0.00")

    # Payment is approximately constant (rounding only on the final row).
    regulars = {row.total_due for row in rows[:-1]}
    assert len(regulars) == 1

    # interest = previous balance x rate; principal = payment - interest.
    rate = Decimal("0.05")
    expected_interest_first = (Decimal("300000") * rate).quantize(Decimal("0.01"))
    assert rows[0].interest_due == expected_interest_first
    assert rows[1].interest_due == (
        (rows[0].remaining_balance * rate).quantize(Decimal("0.01"))
    )


def test_french_twelve_installments_zero_rate() -> None:
    rows = generate_schedule(_config("6000", "0", AmortizationType.FRENCH, 12))

    payments = {row.total_due for row in rows}
    assert payments == {Decimal("500.00")}
    assert sum(row.principal_due for row in rows) == Decimal("6000.00")


def test_french_periodic_payment_formula_known_value() -> None:
    """Hand-verified: P=100000, r=2% monthly, n=6.

        factor = 1.02^6 = 1.126162419264
        payment = 100000 x 0.02 x 1.126162419264 / 0.126162419264
                = 2252.324838528 / 0.126162419264 = 17852.58
    """
    payment = _french_periodic_payment(Decimal("100000"), Decimal("2"), 6)
    assert payment == Decimal("17852.58")


@pytest.mark.parametrize("rate", ["0", "1.5", "10", "35"])
@pytest.mark.parametrize("count", [1, 3, 12])
def test_french_invariants_across_rates_and_terms(rate: str, count: int) -> None:
    rows = generate_schedule(_config("250000", rate, AmortizationType.FRENCH, count))

    assert sum(row.principal_due for row in rows) == Decimal("250000.00")
    assert rows[-1].remaining_balance == Decimal("0.00")
    assert all(row.principal_due >= 0 and row.interest_due >= 0 for row in rows)


def test_schedule_is_deterministic_for_identical_inputs() -> None:
    a = generate_schedule(_config("777777.77", "7.7", AmortizationType.FRENCH, 9))
    b = generate_schedule(_config("777777.77", "7.7", AmortizationType.FRENCH, 9))
    assert a == b


def test_invalid_inputs_rejected() -> None:
    with pytest.raises(Exception):
        _config("0", "10", AmortizationType.FIXED_PRINCIPAL, 5)
    with pytest.raises(Exception):
        _config("-100", "10", AmortizationType.FIXED_PRINCIPAL, 5)
    with pytest.raises(Exception):
        _config("1000", "-1", AmortizationType.FIXED_PRINCIPAL, 5)
