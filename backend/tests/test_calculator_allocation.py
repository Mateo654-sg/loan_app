"""Installment status derivation and payment allocation tests
(TESTING.md §13–16, expected values from PAYMENT_RULES.md §11–30, 58–61)."""

from datetime import date
from decimal import Decimal

import pytest

from app.calculators.payment_allocation import (
    OutstandingInstallment,
    allocate_payment,
)
from app.calculators.statuses import derive_installment_status

DUE = date(2026, 8, 18)
BUSINESS_DATE = date(2026, 8, 21)


def _status(**overrides):  # type: ignore[no-untyped-def]
    kwargs: dict = {
        "due_date": DUE,
        "principal_due": Decimal("100000"),
        "interest_due": Decimal("20000"),
        "late_fee_due": Decimal("5000"),
        "principal_paid": Decimal(0),
        "interest_paid": Decimal(0),
        "late_fee_paid": Decimal(0),
        "business_date": BUSINESS_DATE,
    }
    kwargs.update(overrides)
    return derive_installment_status(**kwargs)


# ---------- installment status ----------


def test_future_pending_installment() -> None:
    status, days = _status(due_date=date(2026, 9, 1))
    assert (status.value, days) == ("PENDING", 0)


def test_overdue_with_days_counted() -> None:
    status, days = _status()
    assert (status.value, days) == ("OVERDUE", 3)  # LOAN_RULES §31 example


def test_partially_paid_before_due_is_partial() -> None:
    status, days = _status(
        due_date=date(2026, 8, 25), interest_paid=Decimal("10000")
    )
    assert (status.value, days) == ("PARTIAL", 0)


def test_fully_paid_is_paid_even_when_past_due() -> None:
    status, days = _status(
        principal_paid=Decimal("100000"),
        interest_paid=Decimal("20000"),
        late_fee_paid=Decimal("5000"),
    )
    assert (status.value, days) == ("PAID", 0)
    # A paid installment can never become overdue just because time passed.


def test_outstanding_never_negative_even_on_overpayment_components() -> None:
    from app.calculators.statuses import outstanding_amount

    result = outstanding_amount(
        principal_due=Decimal("100"),
        interest_due=Decimal("0"),
        late_fee_due=Decimal("0"),
        principal_paid=Decimal("150"),
        interest_paid=Decimal(0),
        late_fee_paid=Decimal(0),
    )
    assert result == Decimal("0.00")


# ---------- allocation: single installment examples ----------


def _one(lf="0", i="0", p="0") -> list[OutstandingInstallment]:
    return [
        OutstandingInstallment(
            installment_id="inst-1",
            late_fee_outstanding=Decimal(lf),
            interest_outstanding=Decimal(i),
            principal_outstanding=Decimal(p),
        )
    ]


def test_official_example_80000_of_125000() -> None:
    """PAYMENT_RULES §14/§62: LF 5,000 + I 20,000 + P 100,000; pay 80,000."""
    result = allocate_payment(Decimal("80000"), _one(lf="5000", i="20000", p="100000"))

    assert len(result.allocations) == 1
    allocation = result.allocations[0]
    assert allocation.late_fee_amount == Decimal("5000")
    assert allocation.interest_amount == Decimal("20000")
    assert allocation.principal_amount == Decimal("55000")
    assert result.credit == Decimal(0)


def test_payment_smaller_than_late_fees_goes_entirely_to_fee() -> None:
    """PAYMENT_RULES §16: pay 5,000 with 20,000 of fees outstanding."""
    result = allocate_payment(Decimal("5000"), _one(lf="20000", i="10000", p="100000"))

    allocation = result.allocations[0]
    assert allocation.late_fee_amount == Decimal("5000")
    assert allocation.interest_amount == Decimal(0)
    assert allocation.principal_amount == Decimal(0)


def test_payment_not_reaching_principal_keeps_principal_intact() -> None:
    """PAYMENT_RULES §15: pay 20,000 against LF 10,000 + I 20,000."""
    result = allocate_payment(Decimal("20000"), _one(lf="10000", i="20000", p="100000"))

    allocation = result.allocations[0]
    assert allocation.late_fee_amount == Decimal("10000")
    assert allocation.interest_amount == Decimal("10000")
    assert allocation.principal_amount == Decimal(0)


def test_full_payment_settles_obligation() -> None:
    result = allocate_payment(Decimal("130000"), _one(lf="10000", i="20000", p="100000"))
    assert result.allocations[0].total == Decimal("130000")
    assert result.credit == Decimal(0)


# ---------- allocation across installments ----------


def _two_installments() -> list[OutstandingInstallment]:
    """PAYMENT_RULES §60: two installments, pay 80,000 across both."""
    return [
        OutstandingInstallment(
            installment_id="inst-1",
            late_fee_outstanding=Decimal("10000"),
            interest_outstanding=Decimal("10000"),
            principal_outstanding=Decimal("30000"),
        ),
        OutstandingInstallment(
            installment_id="inst-2",
            interest_outstanding=Decimal("10000"),
            principal_outstanding=Decimal("40000"),
        ),
    ]


def test_payment_spans_two_installments_oldest_first() -> None:
    result = allocate_payment(Decimal("80000"), _two_installments())

    first, second = result.allocations
    assert first.installment_id == "inst-1"
    assert first.total == Decimal("50000")  # fully settled -> PAID

    assert second.installment_id == "inst-2"
    assert second.late_fee_amount == Decimal(0)
    assert second.interest_amount == Decimal("10000")
    assert second.principal_amount == Decimal("20000")  # PARTIAL remains


def test_future_installment_untouched_while_earliers_cover_payment() -> None:
    installments = [
        OutstandingInstallment(installment_id="old", principal_outstanding=Decimal("60000")),
        OutstandingInstallment(installment_id="future", principal_outstanding=Decimal("90000")),
    ]
    result = allocate_payment(Decimal("50000"), installments)

    assert len(result.allocations) == 1
    assert result.allocations[0].installment_id == "old"
    assert result.credit == Decimal(0)


def test_fully_settled_installments_are_skipped_without_empty_rows() -> None:
    installments = [
        OutstandingInstallment(installment_id="settled"),
        OutstandingInstallment(installment_id="live", interest_outstanding=Decimal("700")),
    ]
    result = allocate_payment(Decimal("700"), installments)

    assert [a.installment_id for a in result.allocations] == ["live"]


# ---------- overpayment / credit ----------


def test_overpayment_becomes_explicit_credit() -> None:
    """PAYMENT_RULES §27/§61: outstanding 100,000; pay 150,000 → credit 50,000."""
    result = allocate_payment(Decimal("150000"), _one(p="100000"))

    assert result.allocations[0].principal_amount == Decimal("100000")
    assert result.credit == Decimal("50000")


def test_invariants_across_randomized_scenarios() -> None:
    """Allocated + credit always equals payment; components never negative."""
    scenarios = [
        (Decimal("1"), [OutstandingInstallment(installment_id="a", principal_outstanding=Decimal("999999"))]),
        (Decimal("12345.67"), [
            OutstandingInstallment(installment_id="a", late_fee_outstanding=Decimal("10"), interest_outstanding=Decimal("10")),
            OutstandingInstallment(installment_id="b", principal_outstanding=Decimal("5")),
        ]),
        (Decimal("999999"), []),
    ]

    for amount, installments in scenarios:
        result = allocate_payment(amount, installments)
        assert result.allocated_total + result.credit == amount
        for allocation in result.allocations:
            assert allocation.late_fee_amount >= 0
            assert allocation.interest_amount >= 0
            assert allocation.principal_amount >= 0


def test_zero_or_negative_payment_rejected() -> None:
    with pytest.raises(Exception):
        allocate_payment(Decimal(0), _one())
    with pytest.raises(Exception):
        allocate_payment(Decimal("-5"), _one())


def test_negative_outstanding_rejected_at_input() -> None:
    with pytest.raises(Exception):
        OutstandingInstallment(installment_id="bad", principal_outstanding=Decimal("-1"))
