import uuid
from datetime import datetime, timezone as dt_timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.loan import LoanInstallment
from app.models.payment import LoanPayment, PaymentAllocation


def lock_installments(
    db: Session, loan_id: uuid.UUID
) -> list[LoanInstallment]:
    """SELECT ... FOR UPDATE in deterministic order (DATABASE.md §48,
    SECURITY.md §24): serializes concurrent payment registrations."""
    return list(
        db.scalars(
            select(LoanInstallment)
            .where(LoanInstallment.loan_id == loan_id)
            .order_by(LoanInstallment.due_date, LoanInstallment.installment_number)
            .with_for_update()
        ).all()
    )


def get_payment_for_user(
    db: Session, payment_id: uuid.UUID, user_id: uuid.UUID
) -> LoanPayment | None:
    return db.scalar(
        select(LoanPayment).where(LoanPayment.id == payment_id, LoanPayment.user_id == user_id)
    )


def find_by_idempotency_key(
    db: Session, user_id: uuid.UUID, idempotency_key: str
) -> LoanPayment | None:
    return db.scalar(
        select(LoanPayment).where(
            LoanPayment.user_id == user_id,
            LoanPayment.idempotency_key == idempotency_key,
        )
    )


def list_payments(
    db: Session,
    loan_id: uuid.UUID,
    *,
    page: int,
    page_size: int,
    include_reversed: bool = True,
) -> tuple[list[LoanPayment], int]:
    from sqlalchemy import func

    conditions = [LoanPayment.loan_id == loan_id]
    if not include_reversed:
        conditions.append(LoanPayment.status == "POSTED")

    base_query = select(LoanPayment).where(*conditions)
    total_items = int(db.scalar(select(func.count()).select_from(base_query.subquery())) or 0)

    items = list(
        db.scalars(
            base_query.order_by(LoanPayment.payment_date.desc(), LoanPayment.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
    )
    return items, total_items


def add_payment(db: Session, payment: LoanPayment) -> None:
    db.add(payment)
    db.flush()


def add_allocation(db: Session, allocation: PaymentAllocation) -> None:
    db.add(allocation)
    db.flush()


def allocations_for_payment(db: Session, payment_id: uuid.UUID) -> list[PaymentAllocation]:
    return list(
        db.scalars(
            select(PaymentAllocation).where(PaymentAllocation.payment_id == payment_id)
        ).all()
    )


def utc_now() -> datetime:
    return datetime.now(dt_timezone.utc)


__all__ = [
    "add_allocation",
    "add_payment",
    "allocations_for_payment",
    "find_by_idempotency_key",
    "get_payment_for_user",
    "list_payments",
    "lock_installments",
    "utc_now",
]
