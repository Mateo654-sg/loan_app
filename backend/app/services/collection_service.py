"""Collections read layer (PRODUCT_SPEC §29–30, LOAN_RULES §56–59,
API.md §49–50).

Read-only by design: late fees shown here are *projected* with the
official calculator; they become authoritative state only when a payment
is registered against the installment. The frontend never computes any
of these values.
"""
import calendar
import uuid
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from enum import Enum

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculators import LateFeeConfig, LateFeeType, calculate_late_fee
from app.calculators.statuses import InstallmentStatus, derive_installment_status
from app.models.client import Client
from app.models.loan import LateFeeConfiguration, Loan, LoanInstallment
from app.models.payment import LoanPayment
from app.schemas.collection import (
    CollectionClassification,
    CollectionItemResponse,
    CollectionsListResponse,
    TodayCollectionsResponse,
    TodayCollectionsSummary,
    build_item,
)
from app.schemas.common import format_money
from app.services.loan_service import business_today


class CollectionFilter(str, Enum):
    TODAY = "TODAY"
    THIS_WEEK = "THIS_WEEK"
    THIS_MONTH = "THIS_MONTH"
    OVERDUE = "OVERDUE"
    UPCOMING = "UPCOMING"
    ALL = "ALL"


@dataclass(frozen=True)
class _ComputedInstallment:
    installment_id: uuid.UUID
    loan_id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    installment_number: int
    due_date: date
    days_overdue_value: int
    classification: str
    installment_status: str
    principal_outstanding: Decimal
    interest_outstanding: Decimal
    late_fee_projected: Decimal
    total_paid: Decimal
    total_outstanding: Decimal
    total_due_scheduled: Decimal


def _urgency_sort_key(item: _ComputedInstallment) -> tuple[int, date, int]:
    # Most overdue days first, then earliest due dates, then installment no.
    return (-max(item.days_overdue_value, 0), item.due_date, item.installment_number)


def _load_fee_configs(db: Session, loan_ids: set[uuid.UUID]) -> dict[uuid.UUID, LateFeeConfig | None]:
    if not loan_ids:
        return {}

    rows = db.scalars(
        select(LateFeeConfiguration).where(LateFeeConfiguration.loan_id.in_(loan_ids))
    ).all()

    configs: dict[uuid.UUID, LateFeeConfig | None] = {loan_id: None for loan_id in loan_ids}
    for row in rows:
        if row.enabled and row.type:
            configs[row.loan_id] = LateFeeConfig(
                enabled=True,
                type=LateFeeType(row.type),
                value=row.value,
                grace_period_days=row.grace_period_days,
            )
    return configs


def _compute_items(db: Session, user_id: uuid.UUID, timezone_name: str) -> list[_ComputedInstallment]:
    today = business_today(timezone_name)

    rows = db.execute(
        select(LoanInstallment, Loan, Client.full_name)
        .join(Loan, Loan.id == LoanInstallment.loan_id)
        .join(Client, Client.id == Loan.client_id)
        .where(
            Loan.user_id == user_id,
            Loan.status != "CANCELLED",
            LoanInstallment.status != "CANCELLED",
        )
        .order_by(LoanInstallment.due_date, LoanInstallment.installment_number)
    ).all()

    fee_configs = _load_fee_configs(db, {loan.id for _installment, loan, _name in rows})

    computed: list[_ComputedInstallment] = []
    for installment, loan, client_name in rows:
        outstanding_total = max(
            (installment.principal_due - installment.principal_paid)
            + (installment.interest_due - installment.interest_paid)
            + (installment.late_fee_due - installment.late_fee_paid),
            Decimal(0),
        )

        status_value, overdue_days = derive_installment_status(
            due_date=installment.due_date,
            principal_due=installment.principal_due,
            interest_due=installment.interest_due,
            late_fee_due=installment.late_fee_due,
            principal_paid=installment.principal_paid,
            interest_paid=installment.interest_paid,
            late_fee_paid=installment.late_fee_paid,
            business_date=today,
        )

        if outstanding_total <= 0:
            classification = InstallmentStatus.PAID.value
        elif overdue_days > 0:
            classification = CollectionClassification.OVERDUE
        elif installment.due_date == today:
            classification = CollectionClassification.DUE_TODAY
        else:
            classification = CollectionClassification.UPCOMING

        projected_late_fee = max(installment.late_fee_due - installment.late_fee_paid, Decimal(0))
        config = fee_configs.get(loan.id)
        if (
            classification == CollectionClassification.OVERDUE
            and installment.late_fee_due == 0
            and config is not None
        ):
            base = max(installment.principal_due - installment.principal_paid, Decimal(0))
            projected_late_fee = calculate_late_fee(
                config, base_amount=base, days_overdue=overdue_days
            )

        computed.append(
            _ComputedInstallment(
                installment_id=installment.id,
                loan_id=loan.id,
                client_id=loan.client_id,
                client_name=client_name,
                installment_number=installment.installment_number,
                due_date=installment.due_date,
                days_overdue_value=overdue_days,
                classification=classification,
                installment_status=status_value.value,
                principal_outstanding=max(
                    installment.principal_due - installment.principal_paid, Decimal(0)
                ),
                interest_outstanding=max(
                    installment.interest_due - installment.interest_paid, Decimal(0)
                ),
                late_fee_projected=projected_late_fee,
                total_paid=(
                    installment.principal_paid
                    + installment.interest_paid
                    + installment.late_fee_paid
                ),
                total_outstanding=outstanding_total,
                total_due_scheduled=installment.total_due,
            )
        )

    return computed


def _to_response(item: _ComputedInstallment) -> CollectionItemResponse:
    return build_item(
        installment_id=item.installment_id,
        loan_id=item.loan_id,
        client_id=item.client_id,
        client_name=item.client_name,
        installment_number=item.installment_number,
        due_date=item.due_date,
        days_overdue_value=item.days_overdue_value,
        classification=item.classification,
        installment_status=item.installment_status,
        principal_outstanding=item.principal_outstanding,
        interest_outstanding=item.interest_outstanding,
        late_fee_projected=item.late_fee_projected,
        total_paid=item.total_paid,
        total_outstanding=item.total_outstanding,
    )


def get_today_collections(db: Session, user_id: uuid.UUID, timezone_name: str) -> TodayCollectionsResponse:
    """Due-today items plus outstanding overdue ones (PRODUCT_SPEC §29)."""
    today = business_today(timezone_name)
    all_items = _compute_items(db, user_id, timezone_name)

    relevant = [
        item
        for item in all_items
        if item.classification in (CollectionClassification.DUE_TODAY, CollectionClassification.OVERDUE)
    ]
    relevant.sort(key=_urgency_sort_key)

    # Expected = scheduled amounts for today (PAYMENT_RULES SS50), not the
    # remaining part; Pending derives as expected - collected.
    expected_today = sum(
        (
            item.total_due_scheduled
            for item in all_items
            if item.classification == CollectionClassification.DUE_TODAY
        ),
        Decimal(0),
    )
    collected_rows = db.scalars(
        select(LoanPayment.amount).where(
            LoanPayment.user_id == user_id,
            LoanPayment.payment_date == today,
            LoanPayment.status == "POSTED",
        )
    ).all()
    collected_today = sum((Decimal(amount) for amount in collected_rows), Decimal(0))

    pending_today = max(expected_today - collected_today, Decimal(0))
    overdue_total = sum(
        (item.total_outstanding for item in all_items if item.classification == CollectionClassification.OVERDUE),
        Decimal(0),
    )

    return TodayCollectionsResponse(
        business_date=today,
        summary=TodayCollectionsSummary(
            expected_today=format_money(expected_today),
            collected_today=format_money(collected_today),
            pending_today=format_money(pending_today),
            overdue=format_money(overdue_total),
        ),
        items=[_to_response(item) for item in relevant],
    )


def list_collections(
    db: Session,
    user_id: uuid.UUID,
    timezone_name: str,
    *,
    collection_filter: CollectionFilter,
    client_id: uuid.UUID | None = None,
    loan_id: uuid.UUID | None = None,
) -> CollectionsListResponse:
    today = business_today(timezone_name)
    all_items = _compute_items(db, user_id, timezone_name)

    if collection_filter == CollectionFilter.TODAY:
        filtered = [
            i
            for i in all_items
            if i.classification in (CollectionClassification.DUE_TODAY, CollectionClassification.OVERDUE)
        ]
    elif collection_filter == CollectionFilter.THIS_WEEK:
        monday = today.fromordinal(today.toordinal() - today.weekday())
        sunday = monday + timedelta(days=6)
        filtered = [i for i in all_items if monday <= i.due_date <= sunday]
    elif collection_filter == CollectionFilter.THIS_MONTH:
        first_day = today.replace(day=1)
        last_day = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
        filtered = [i for i in all_items if first_day <= i.due_date <= last_day]
    elif collection_filter == CollectionFilter.OVERDUE:
        filtered = [i for i in all_items if i.classification == CollectionClassification.OVERDUE]
    elif collection_filter == CollectionFilter.UPCOMING:
        filtered = [i for i in all_items if i.classification == CollectionClassification.UPCOMING]
    else:
        # ALL: every outstanding obligation regardless of timing; settled
        # installments are not "collections" (PRODUCT_SPEC SS30).
        filtered = [
            i
            for i in all_items
            if i.classification != InstallmentStatus.PAID.value
        ]

    if client_id is not None:
        filtered = [i for i in filtered if i.client_id == client_id]
    if loan_id is not None:
        filtered = [i for i in filtered if i.loan_id == loan_id]

    filtered.sort(key=_urgency_sort_key)

    return CollectionsListResponse(
        business_date=today,
        filter=collection_filter.value,
        items=[_to_response(i) for i in filtered],
    )


__all__ = ["CollectionFilter", "get_today_collections", "list_collections"]
