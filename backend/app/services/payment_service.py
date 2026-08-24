import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculators import (
    LateFeeConfig,
    LateFeeType,
    OutstandingInstallment,
    allocate_payment,
    calculate_late_fee,
    days_overdue as days_overdue_between,
)
from app.calculators.statuses import InstallmentStatus, derive_installment_status
from app.core.audit import record_audit
from app.core.errors import AppError
from app.models.category import Category, Transaction
from app.models.loan import LateFeeConfiguration, Loan
from app.models.payment import LoanPayment, PaymentAllocation
from app.repositories import loan_repository, payment_repository
from app.schemas.common import format_money
from app.schemas.payment import PaymentCreate, PaymentResponse, ReversalRequest
from app.services.loan_service import business_today, derive_loan_status, get_loan_or_404

# Personal finance integration (FINANCIAL_RULES §26–31): only interest and
# late fees are income; principal recovery is NOT income and is never posted.
INCOME_SOURCE_TYPE = "LOAN_PAYMENT"


def register_payment(
    db: Session,
    user_id: uuid.UUID,
    loan_id: uuid.UUID,
    payload: PaymentCreate,
    *,
    idempotency_key: str | None = None,
) -> tuple[LoanPayment, list[PaymentAllocation]]:
    """Register a payment atomically (PAYMENT_RULES §37–40, §65–69).

    Steps: ownership → state validation → idempotency replay → lock rows →
    apply eligible late fees → engine allocation → persist payment +
    allocations + installment/loan updates + income records + audit → commit.
    """
    loan = get_loan_or_404(db, user_id, loan_id)

    if idempotency_key:
        existing = payment_repository.find_by_idempotency_key(db, user_id, idempotency_key)
        if existing is not None:
            # Idempotent replay: return the original operation untouched.
            return existing, payment_repository.allocations_for_payment(db, existing.id)

    if loan.status == "CANCELLED":
        raise AppError(code="LOAN_CANCELLED", message="Payments against a cancelled loan are not allowed.", http_status=409)

    installments = payment_repository.lock_installments(db, loan.id)

    today = business_today(_user_timezone(db, user_id))
    _apply_eligible_late_fees(installments, db, loan.id)

    outstanding_before = sum(
        (_installment_outstanding(i) for i in installments), Decimal(0)
    )
    if outstanding_before <= 0:
        raise AppError(
            code="LOAN_ALREADY_PAID",
            message="This loan has no outstanding obligations.",
            http_status=409,
        )

    queue = _build_allocation_queue(payload.installment_id, installments)
    result = allocate_payment(payload.amount, queue)
    allocation_by_id = {a.installment_id: a for a in result.allocations}

    payment = LoanPayment(
        user_id=user_id,
        loan_id=loan.id,
        client_id=loan.client_id,
        amount=payload.amount,
        payment_date=payload.payment_date,
        payment_method=payload.payment_method,
        reference=payload.reference,
        notes=payload.notes,
        status="POSTED",
        credit_amount=result.credit,
        idempotency_key=idempotency_key,
    )
    payment_repository.add_payment(db, payment)

    income_total = Decimal(0)
    for installment in installments:
        allocated = allocation_by_id.get(str(installment.id))
        if allocated is None:
            continue

        installment.principal_paid += allocated.principal_amount
        installment.interest_paid += allocated.interest_amount
        installment.late_fee_paid += allocated.late_fee_amount

        payment_repository.add_allocation(
            db,
            PaymentAllocation(
                payment_id=payment.id,
                installment_id=installment.id,
                principal_amount=allocated.principal_amount,
                interest_amount=allocated.interest_amount,
                late_fee_amount=allocated.late_fee_amount,
            ),
        )

        _refresh_installment_state(installment, today)

        income_total += allocated.interest_amount + allocated.late_fee_amount

    if income_total > 0:
        _post_interest_income(
            db,
            user_id=user_id,
            payment=payment,
            amount=income_total,
            interest_only=_income_split(installments, allocation_by_id),
        )

    derive_loan_status(loan, installments, today)

    record_audit(
        db,
        user_id=user_id,
        action="CREATE_PAYMENT",
        entity_type="loan_payment",
        entity_id=payment.id,
        metadata={
            "loan_id": str(loan.id),
            "amount": format_money(payment.amount),
            "credit": format_money(result.credit),
            "interest_income": format_money(income_total),
        },
    )

    db.commit()
    return payment, payment_repository.allocations_for_payment(db, payment.id)


def reverse_payment(
    db: Session,
    user_id: uuid.UUID,
    loan_id: uuid.UUID,
    payment_id: uuid.UUID,
    payload: ReversalRequest,
) -> LoanPayment:
    """Reverse deterministically from stored allocations (PAYMENT_RULES §41–45).

    Restores the exact allocated amounts per installment — safe even when
    subsequent payments exist (§44) — and cancels the linked income records."""
    get_loan_or_404(db, user_id, loan_id)

    payment = payment_repository.get_payment_for_user(db, payment_id, user_id)
    if payment is None or payment.loan_id != loan_id:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    if payment.status == "REVERSED":
        raise AppError(
            code="PAYMENT_ALREADY_REVERSED",
            message="Payment is already reversed.",
            http_status=409,
        )

    allocations = payment_repository.allocations_for_payment(db, payment.id)
    installments = {
        i.id: i for i in payment_repository.lock_installments(db, loan_id)
    }

    for allocation in allocations:
        installment = installments.get(allocation.installment_id)
        if installment is None:
            continue
        installment.principal_paid = max(installment.principal_paid - allocation.principal_amount, Decimal(0))
        installment.interest_paid = max(installment.interest_paid - allocation.interest_amount, Decimal(0))
        installment.late_fee_paid = max(installment.late_fee_paid - allocation.late_fee_amount, Decimal(0))
        # Late fee becomes claimable again after reversal.
        _refresh_installment_state(installment, business_today(_user_timezone(db, user_id)))

    payment.status = "REVERSED"
    payment.reversed_at = payment_repository.utc_now()
    payment.reversal_reason = payload.reason

    _cancel_linked_income(db, payment.id)

    loan = db.get(Loan, loan_id)
    if loan is not None:
        ordered = payment_repository.lock_installments(db, loan_id)
        derive_loan_status(loan, ordered, business_today(_user_timezone(db, user_id)))

    record_audit(
        db,
        user_id=user_id,
        action="REVERSE_PAYMENT",
        entity_type="loan_payment",
        entity_id=payment.id,
        metadata={
            "loan_id": str(loan_id),
            "amount": format_money(payment.amount),
            "reason": payload.reason,
        },
    )

    db.commit()
    return payment


def list_payments_for_loan(
    db: Session, user_id: uuid.UUID, loan_id: uuid.UUID, *, page: int, page_size: int
) -> tuple[list[LoanPayment], int]:
    get_loan_or_404(db, user_id, loan_id)
    return payment_repository.list_payments(db, loan_id, page=page, page_size=page_size)


def get_payment_detail(
    db: Session, user_id: uuid.UUID, loan_id: uuid.UUID, payment_id: uuid.UUID
) -> PaymentResponse:
    payment = payment_repository.get_payment_for_user(db, payment_id, user_id)
    if payment is None or payment.loan_id != loan_id:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)
    return PaymentResponse.from_model(payment, payment_repository.allocations_for_payment(db, payment.id))


# ---------- internals ----------


def _installment_outstanding(installment) -> Decimal:  # type: ignore[no-untyped-def]
    return (
        installment.principal_due
        - installment.principal_paid
        + installment.interest_due
        - installment.interest_paid
        + installment.late_fee_due
        - installment.late_fee_paid
    )


def _apply_eligible_late_fees(installments: list, db: Session, loan_id: uuid.UUID) -> None:
    """Apply each overdue installment's late fee once (v1.0 rule)."""
    config_row = loan_repository.get_late_fee_configuration(db, loan_id)
    if config_row is None or not config_row.enabled:
        return

    if not config_row.type:
        return
    config = LateFeeConfig(
        enabled=True,
        type=LateFeeType(config_row.type),
        value=config_row.value,
        grace_period_days=config_row.grace_period_days,
    )
    today = business_today(_user_timezone(db, _loan_user(db, loan_id)))

    for installment in installments:
        if installment.late_fee_due > 0:
            continue  # already applied once
        base = max(installment.principal_due - installment.principal_paid, Decimal(0))
        elapsed = days_overdue_between(installment.due_date, today)
        fee = calculate_late_fee(config, base_amount=base, days_overdue=elapsed)
        if fee > 0:
            installment.late_fee_due += fee


def _loan_user(db: Session, loan_id: uuid.UUID) -> uuid.UUID:
    from app.models.user import User  # noqa: F401  (ownership already verified upstream)

    loan = db.get(Loan, loan_id)
    assert loan is not None
    return loan.user_id


def _user_timezone(db: Session, user_id: uuid.UUID) -> str:
    from app.models.user import User

    user = db.get(User, user_id)
    return user.timezone if user and user.timezone else "America/Bogota"


def _build_allocation_queue(
    target_installment_id: uuid.UUID | None, installments: list
) -> list[OutstandingInstallment]:
    """Targeted installment first, then oldest-outstanding-first (§20–24)."""
    def to_outstanding(i):  # type: ignore[no-untyped-def]
        return OutstandingInstallment(
            installment_id=str(i.id),
            late_fee_outstanding=max(i.late_fee_due - i.late_fee_paid, Decimal(0)),
            interest_outstanding=max(i.interest_due - i.interest_paid, Decimal(0)),
            principal_outstanding=max(i.principal_due - i.principal_paid, Decimal(0)),
        )

    queue = [to_outstanding(i) for i in installments]

    if target_installment_id is not None:
        key = str(target_installment_id)
        targeted = next((o for o in queue if o.installment_id == key), None)
        if targeted is None:
            raise AppError(
                code="INVALID_INSTALLMENT_STATE",
                message="The referenced installment does not belong to this loan.",
                http_status=422,
            )
        rest = [o for o in queue if o.installment_id != key]
        return [targeted] + rest
    return queue


def _refresh_installment_state(installment, today) -> None:  # type: ignore[no-untyped-def]
    installment.remaining_balance = max(_installment_outstanding(installment), Decimal(0))
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
    installment.status = status.value


def _income_split(installments: list, allocation_by_id: dict) -> dict[str, Decimal]:  # type: ignore[no-untyped-def]
    split = {"interest": Decimal(0), "late_fee": Decimal(0)}
    for installment in installments:
        allocated = allocation_by_id.get(str(installment.id))
        if allocated is None:
            continue
        split["interest"] += allocated.interest_amount
        split["late_fee"] += allocated.late_fee_amount
    return split


def _post_interest_income(
    db: Session,
    *,
    user_id: uuid.UUID,
    payment: LoanPayment,
    amount: Decimal,
    interest_only: dict[str, Decimal],
) -> None:
    """One traceable income transaction = collected interest + late fees.

    Principal recovery is intentionally NOT income (FINANCIAL_RULES §25–31).
    """
    def _find_category(name: str) -> Category | None:
        return db.scalar(
            select(Category).where(
                Category.user_id == user_id,
                Category.type == "INCOME",
                Category.name.ilike(name),
            )
        )

    # Seeded accounts always have Interest; fall back to Other defensively.
    category = _find_category("Interest") or _find_category("Other")
    if category is None:
        raise AppError(
            code="CATEGORY_MISSING",
            message="No income category available to record collected interest.",
            http_status=409,
        )
    category_id = category.id

    description = f"Collected interest & late fees · payment {payment.id}"
    db.add(
        Transaction(
            user_id=user_id,
            category_id=category_id,
            type="INCOME",
            amount=amount,
            transaction_date=payment.payment_date,
            description=description,
            payment_method=None,
            notes=(
                f"interest={format_money(interest_only['interest'])}; "
                f"late_fee={format_money(interest_only['late_fee'])}"
            ),
            source_type=INCOME_SOURCE_TYPE,
            source_id=payment.id,
        )
    )
    db.flush()


def _cancel_linked_income(db: Session, payment_id: uuid.UUID) -> None:
    linked = list(
        db.scalars(
            select(Transaction).where(
                Transaction.source_type == INCOME_SOURCE_TYPE,
                Transaction.source_id == payment_id,
            )
        ).all()
    )
    for transaction in linked:
        transaction.status = "CANCELLED"


__all__ = [
    "get_payment_detail",
    "list_payments_for_loan",
    "register_payment",
    "reverse_payment",
]
