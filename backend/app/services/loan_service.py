import uuid
from datetime import date
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.calculators import (
    AmortizationType,
    PaymentFrequency,
    ScheduleDatesInput,
    ScheduleInput,
    generate_schedule,
)
from app.calculators.statuses import InstallmentStatus, derive_installment_status
from app.core.audit import record_audit
from app.core.errors import AppError
from app.models.client import Client
from app.models.loan import LateFeeConfiguration, Loan, LoanInstallment
from app.repositories import client_repository, loan_repository
from app.schemas.common import format_money
from app.schemas.loan import (
    InstallmentResponse,
    LoanCreate,
    LoanResponse,
    LoanScheduleResponse,
    LateFeeConfigInput,
)

_FREQUENCY_MAP: dict[str, PaymentFrequency] = {f.value: f for f in PaymentFrequency}
_AMORTIZATION_MAP: dict[str, AmortizationType] = {a.value: a for a in AmortizationType}


def create_loan(
    db: Session, user_id: uuid.UUID, payload: LoanCreate
) -> tuple[Loan, list[LoanInstallment]]:
    """Create a loan and its schedule atomically (LOAN_RULES §45, §49;
    ARCHITECTURE §19). The validated financial engine generates the
    schedule; this service only persists its deterministic output."""
    client = client_repository.get_for_user(db, payload.client_id, user_id)
    if client is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    components = generate_schedule(
        ScheduleInput(
            principal=payload.principal,
            rate_percent=payload.interest_rate,
            amortization_type=_AMORTIZATION_MAP[payload.amortization_type.value],
            dates_config=ScheduleDatesInput(
                frequency=_FREQUENCY_MAP[payload.payment_frequency.value],
                number_of_installments=payload.number_of_installments,
                first_due_date=payload.first_due_date,
            ),
        )
    )

    # Explicit id up front so installments/config can reference it before flush.
    loan = Loan(
        id=uuid.uuid4(),
        user_id=user_id,
        client_id=client.id,
        principal=payload.principal,
        start_date=payload.start_date,
        interest_rate=payload.interest_rate,
        interest_period=payload.interest_period.value,
        amortization_type=payload.amortization_type.value,
        payment_frequency=payload.payment_frequency.value,
        number_of_installments=payload.number_of_installments,
        first_due_date=payload.first_due_date,
        guarantee=payload.guarantee,
        notes=payload.notes,
    )

    installments = [
        LoanInstallment(
            loan_id=loan.id,
            installment_number=component.installment_number,
            due_date=component.due_date,
            principal_due=component.principal_due,
            interest_due=component.interest_due,
            late_fee_due=Decimal("0.00"),
            total_due=component.total_due,
            remaining_balance=component.total_due,
            status=InstallmentStatus.PENDING.value,
        )
        for component in components
    ]

    late_fee_config = _build_late_fee_config(payload.late_fee_configuration)

    loan_repository.create_with_schedule(db, loan, late_fee_config, installments)

    record_audit(
        db,
        user_id=user_id,
        action="CREATE_LOAN",
        entity_type="loan",
        entity_id=loan.id,
        metadata={
            "client_id": str(client.id),
            "principal": format_money(payload.principal),
            "amortization_type": loan.amortization_type,
            "payment_frequency": loan.payment_frequency,
            "interest_period": loan.interest_period,
            "installments": loan.number_of_installments,
        },
    )

    db.commit()
    return loan, installments


def _build_late_fee_config(config_input: LateFeeConfigInput | None) -> LateFeeConfiguration | None:
    if config_input is None or not config_input.enabled:
        return None
    return LateFeeConfiguration(
        enabled=True,
        type=config_input.type,
        value=config_input.value,
        grace_period_days=config_input.grace_period_days,
    )


def get_loan_or_404(db: Session, user_id: uuid.UUID, loan_id: uuid.UUID) -> Loan:
    loan = loan_repository.get_for_user(db, loan_id, user_id)
    if loan is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)
    return loan


def business_today(timezone_name: str) -> date:
    """Current financial date in the user's configured timezone
    (FINANCIAL_RULES.md §33; PRODUCT_SPECIFICATION.md §21)."""
    try:
        zone = ZoneInfo(timezone_name)
    except Exception:
        zone = ZoneInfo("America/Bogota")
    from datetime import datetime, timezone as dt_timezone

    return datetime.now(dt_timezone.utc).astimezone(zone).date()


def derive_loan_status(loan: Loan, installments: list[LoanInstallment], today: date) -> str:
    """Backend-authoritative loan status (LOAN_RULES.md §4, §42–44).

    CANCELLED is only set by the explicit cancel operation; otherwise:
    PAID when nothing is outstanding, OVERDUE when any installment is
    overdue with balance, ACTIVE otherwise."""
    if loan.status == "CANCELLED":
        return "CANCELLED"

    any_outstanding = False
    for installment in installments:
        status, _days = derive_installment_status(
            due_date=installment.due_date,
            principal_due=installment.principal_due,
            interest_due=installment.interest_due,
            late_fee_due=installment.late_fee_due,
            principal_paid=installment.principal_paid,
            interest_paid=installment.interest_paid,
            late_fee_paid=installment.late_fee_paid,
            business_date=today,
        )
        if status == InstallmentStatus.OVERDUE:
            return "OVERDUE"
        if status != InstallmentStatus.PAID:
            any_outstanding = True

    return "ACTIVE" if any_outstanding else "PAID"


def get_loan_detail(db: Session, user_id: uuid.UUID, loan_id: uuid.UUID) -> LoanResponse:
    """Detail with live derived status and metrics."""
    loan = get_loan_or_404(db, user_id, loan_id)
    installments = loan_repository.list_installments(db, loan.id)
    today = business_today(_user_timezone(db, user_id))

    live_status = derive_loan_status(loan, installments, today)
    loan.status = live_status if loan.status != "CANCELLED" else loan.status

    metrics = loan_repository.loan_metrics(db, loan)
    client_name = _client_name(db, loan.client_id)

    response = _to_response(loan, metrics, client_name)
    response.status = live_status
    return response


def list_loans(
    db: Session,
    user_id: uuid.UUID,
    *,
    filters: loan_repository.LoanFilters,
    page: int,
    page_size: int,
) -> tuple[list["LoanResponse"], int]:
    rows, total_items = loan_repository.list_for_user(
        db, user_id, filters, page=page, page_size=page_size
    )

    responses: list[LoanResponse] = []
    for loan, client_name in rows:
        metrics = loan_repository.loan_metrics(db, loan)
        responses.append(_to_response(loan, metrics, client_name))

    return responses, total_items


def get_loan_schedule(db: Session, user_id: uuid.UUID, loan_id: uuid.UUID) -> LoanScheduleResponse:
    loan = get_loan_or_404(db, user_id, loan_id)
    installments = loan_repository.list_installments(db, loan.id)
    today = business_today(_user_timezone(db, user_id))

    items: list[InstallmentResponse] = []
    for installment in installments:
        status, days_overdue_value = derive_installment_status(
            due_date=installment.due_date,
            principal_due=installment.principal_due,
            interest_due=installment.interest_due,
            late_fee_due=installment.late_fee_due,
            principal_paid=installment.principal_paid,
            interest_paid=installment.interest_paid,
            late_fee_paid=installment.late_fee_paid,
            business_date=today,
        )
        items.append(
            InstallmentResponse(
                id=installment.id,
                installment_number=installment.installment_number,
                due_date=installment.due_date,
                principal_due=format_money(installment.principal_due),
                interest_due=format_money(installment.interest_due),
                late_fee_due=format_money(installment.late_fee_due),
                total_due=format_money(installment.total_due),
                principal_paid=format_money(installment.principal_paid),
                interest_paid=format_money(installment.interest_paid),
                late_fee_paid=format_money(installment.late_fee_paid),
                remaining_balance=format_money(installment.remaining_balance),
                status=status.value,
            )
        )

    return LoanScheduleResponse(loan_id=loan.id, business_date=today, installments=items)


def cancel_loan(db: Session, user_id: uuid.UUID, loan_id: uuid.UUID) -> Loan:
    """Cancellation preserves all history (LOAN_RULES.md §47–48)."""
    loan = get_loan_or_404(db, user_id, loan_id)

    if loan.status == "CANCELLED":
        raise AppError(code="LOAN_ALREADY_CANCELLED", message="Loan is already cancelled.", http_status=409)

    loan.status = "CANCELLED"
    record_audit(
        db,
        user_id=user_id,
        action="CANCEL_LOAN",
        entity_type="loan",
        entity_id=loan.id,
        metadata={"previous_status": loan.status},
    )
    db.commit()
    db.refresh(loan)
    return loan


# ---------- helpers ----------


def _user_timezone(db: Session, user_id: uuid.UUID) -> str:
    from app.models.user import User

    user = db.get(User, user_id)
    return user.timezone if user and user.timezone else "America/Bogota"


def _client_name(db: Session, client_id: uuid.UUID) -> str:
    client = db.get(Client, client_id)
    return client.full_name if client else ""


def _to_response(loan: Loan, metrics: dict[str, Decimal], client_name: str) -> "LoanResponse":
    from app.schemas.loan import LoanResponse

    return LoanResponse(
        id=loan.id,
        client_id=loan.client_id,
        client_name=client_name,
        principal=format_money(loan.principal),
        outstanding_principal=format_money(metrics["outstanding_principal"]),
        scheduled_interest=format_money(metrics["scheduled_interest"]),
        outstanding_interest=format_money(metrics["outstanding_interest"]),
        collected_interest=format_money(metrics["collected_interest"]),
        scheduled_late_fees=format_money(metrics["scheduled_late_fees"]),
        outstanding_late_fees=format_money(metrics["outstanding_late_fees"]),
        collected_late_fees=format_money(metrics["collected_late_fees"]),
        total_outstanding=format_money(metrics["total_outstanding"]),
        interest_rate=str(loan.interest_rate.normalize()),
        interest_period=loan.interest_period,
        amortization_type=loan.amortization_type,
        payment_frequency=loan.payment_frequency,
        number_of_installments=loan.number_of_installments,
        first_due_date=loan.first_due_date,
        status=loan.status,
        guarantee=loan.guarantee,
        notes=loan.notes,
        created_at=loan.created_at,
    )


__all__ = [
    "business_today",
    "cancel_loan",
    "create_loan",
    "derive_loan_status",
    "get_loan_detail",
    "get_loan_or_404",
    "get_loan_schedule",
    "list_loans",
]
