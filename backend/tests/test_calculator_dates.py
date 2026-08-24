"""Date engine tests (TESTING.md §10–11): month transitions, February,
leap years, year transitions, every payment frequency."""

from datetime import date

import pytest

from app.calculators.dates import (
    DateEngineError,
    PaymentFrequency,
    ScheduleDatesInput,
    days_overdue,
    generate_due_dates,
)


def test_once_frequency_returns_single_date() -> None:
    dates = generate_due_dates(
        ScheduleDatesInput(
            frequency=PaymentFrequency.ONCE, number_of_installments=1, first_due_date=date(2026, 9, 21)
        )
    )
    assert dates == [date(2026, 9, 21)]


def test_once_rejects_multiple_installments() -> None:
    with pytest.raises(DateEngineError):
        generate_due_dates(
            ScheduleDatesInput(
                frequency=PaymentFrequency.ONCE, number_of_installments=2, first_due_date=date(2026, 9, 21)
            )
        )


def test_daily_frequency_steps_one_day() -> None:
    # LOAN_RULES.md §19: start Aug 21 -> first DUE date is Aug 22; the
    # sequence is inclusive of the configured first due date.
    dates = generate_due_dates(
        ScheduleDatesInput(
            frequency=PaymentFrequency.DAILY, number_of_installments=3, first_due_date=date(2026, 8, 22)
        )
    )
    assert dates == [date(2026, 8, 22), date(2026, 8, 23), date(2026, 8, 24)]


def test_weekly_and_biweekly_steps() -> None:
    weekly = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.WEEKLY, number_of_installments=4, first_due_date=date(2026, 8, 21))
    )
    assert weekly[1:] == [date(2026, 8, 28), date(2026, 9, 4), date(2026, 9, 11)]

    biweekly = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.BIWEEKLY, number_of_installments=4, first_due_date=date(2026, 8, 21))
    )
    assert biweekly[1:] == [date(2026, 9, 4), date(2026, 9, 18), date(2026, 10, 2)]


def test_monthly_transitions_across_year() -> None:
    dates = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.MONTHLY, number_of_installments=4, first_due_date=date(2026, 1, 15))
    )
    assert dates == [date(2026, 1, 15), date(2026, 2, 15), date(2026, 3, 15), date(2026, 4, 15)]

    year_end = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.MONTHLY, number_of_installments=3, first_due_date=date(2026, 11, 20))
    )
    assert year_end == [date(2026, 11, 20), date(2026, 12, 20), date(2027, 1, 20)]


def test_monthly_clamps_to_last_valid_day_of_february() -> None:
    non_leap = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.MONTHLY, number_of_installments=2, first_due_date=date(2026, 1, 31))
    )
    leap = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.MONTHLY, number_of_installments=2, first_due_date=date(2024, 1, 31))
    )

    # Jan 31 -> Feb 28 (2026) and Feb 29 (leap 2024); anchor day is preserved
    # afterwards: March goes back to 31 (LOAN_RULES.md §23).
    assert non_leap == [date(2026, 1, 31), date(2026, 2, 28)]
    assert leap == [date(2024, 1, 31), date(2024, 2, 29)]

    march_after_clamp = generate_due_dates(
        ScheduleDatesInput(frequency=PaymentFrequency.MONTHLY, number_of_installments=3, first_due_date=date(2026, 1, 31))
    )
    assert march_after_clamp == [date(2026, 1, 31), date(2026, 2, 28), date(2026, 3, 31)]


def test_custom_requires_matching_explicit_dates() -> None:
    custom = [date(2026, 8, 10), date(2026, 8, 25)]
    dates = generate_due_dates(
        ScheduleDatesInput(
            frequency=PaymentFrequency.CUSTOM,
            number_of_installments=2,
            first_due_date=date(2026, 8, 10),
            custom_dates=custom,
        )
    )
    assert dates == custom

    with pytest.raises(DateEngineError):
        generate_due_dates(
            ScheduleDatesInput(
                frequency=PaymentFrequency.CUSTOM,
                number_of_installments=3,
                first_due_date=date(2026, 8, 10),
                custom_dates=custom,
            )
        )


def test_zero_or_negative_installment_count_rejected() -> None:
    with pytest.raises(Exception):
        ScheduleDatesInput(frequency=PaymentFrequency.WEEKLY, number_of_installments=0, first_due_date=date(2026, 8, 21))


def test_days_overdue_counts_only_past_dates() -> None:
    assert days_overdue(date(2026, 8, 18), date(2026, 8, 21)) == 3
    assert days_overdue(date(2026, 8, 21), date(2026, 8, 21)) == 0
    assert days_overdue(date(2026, 8, 23), date(2026, 8, 21)) == 0
