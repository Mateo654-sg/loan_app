import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.client import Client
from app.models.loan import LateFeeConfiguration, Loan, LoanInstallment


def create_with_schedule(
    db: Session,
    loan: Loan,
    late_fee_config: LateFeeConfiguration | None,
    installments: list[LoanInstallment],
) -> Loan:
    # Flush first so the loan row exists before dependents reference its id
    # (no ORM relationships are declared between these models).
    db.add(loan)
    db.flush()

    if late_fee_config is not None:
        late_fee_config.loan_id = loan.id
        db.add(late_fee_config)
    for installment in installments:
        installment.loan_id = loan.id
        db.add(installment)
    db.flush()
    return loan


def get_for_user(db: Session, loan_id: uuid.UUID, user_id: uuid.UUID) -> Loan | None:
    return db.scalar(select(Loan).where(Loan.id == loan_id, Loan.user_id == user_id))


class LoanFilters:
    def __init__(
        self,
        *,
        status: str | None = None,
        client_id: uuid.UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> None:
        self.status = status
        self.client_id = client_id
        self.start_date = start_date
        self.end_date = end_date


def list_for_user(
    db: Session,
    user_id: uuid.UUID,
    filters: LoanFilters,
    *,
    page: int,
    page_size: int,
) -> tuple[list[tuple[Loan, str]], int]:
    conditions = [Loan.user_id == user_id]
    if filters.status is not None:
        conditions.append(Loan.status == filters.status)
    if filters.client_id is not None:
        conditions.append(Loan.client_id == filters.client_id)
    if filters.start_date is not None:
        conditions.append(Loan.start_date >= filters.start_date)
    if filters.end_date is not None:
        conditions.append(Loan.start_date <= filters.end_date)

    base_query = (
        select(Loan, Client.full_name)
        .join(Client, Client.id == Loan.client_id)
        .where(*conditions)
    )

    total_items = int(db.scalar(select(func.count()).select_from(base_query.subquery())) or 0)

    rows = list(
        db.execute(
            base_query.order_by(Loan.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
    )

    return rows, total_items


def list_installments(db: Session, loan_id: uuid.UUID) -> list[LoanInstallment]:
    return list(
        db.scalars(
            select(LoanInstallment)
            .where(LoanInstallment.loan_id == loan_id)
            .order_by(LoanInstallment.installment_number)
        ).all()
    )


def get_late_fee_configuration(db: Session, loan_id: uuid.UUID) -> LateFeeConfiguration | None:
    return db.scalar(
        select(LateFeeConfiguration).where(LateFeeConfiguration.loan_id == loan_id)
    )


# ---------- derived metrics (DATABASE.md §43–45: never independently editable) ----------


def _sum_installments(
    db: Session,
    loan_id: uuid.UUID,
    column_due,
    column_paid,
) -> tuple[Decimal, Decimal]:
    """Return (scheduled, collected) for one component over active installments."""
    row = db.execute(
        select(
            func.coalesce(func.sum(column_due - column_paid), 0),
            func.coalesce(func.sum(column_paid), 0),
        ).where(LoanInstallment.loan_id == loan_id)
    ).one()
    return Decimal(row[0]), Decimal(row[1])


def loan_metrics(db: Session, loan: Loan) -> dict[str, Decimal]:
    """Derived financial metrics from persisted installments.

    outstanding = Σ(due − paid); collected = Σ paid. Late fees start at zero
    and only become due through the late-fee engine (Phase 7+ applies them).
    """
    outstanding_principal, collected_principal = _sum_installments(
        db, loan.id, LoanInstallment.principal_due, LoanInstallment.principal_paid
    )
    scheduled_interest, collected_interest = _sum_installments(
        db, loan.id, LoanInstallment.interest_due, LoanInstallment.interest_paid
    )
    scheduled_late_fees, collected_late_fees = _sum_installments(
        db, loan.id, LoanInstallment.late_fee_due, LoanInstallment.late_fee_paid
    )

    total_outstanding = (
        outstanding_principal + max(scheduled_interest - collected_interest, Decimal(0)) + scheduled_late_fees - collected_late_fees
    )

    return {
        "outstanding_principal": outstanding_principal,
        "collected_principal": collected_principal,
        "scheduled_interest": scheduled_interest,
        "outstanding_interest": max(scheduled_interest - collected_interest, Decimal(0)),
        "collected_interest": collected_interest,
        "scheduled_late_fees": scheduled_late_fees,
        "outstanding_late_fees": max(scheduled_late_fees - collected_late_fees, Decimal(0)),
        "collected_late_fees": collected_late_fees,
        "total_outstanding": total_outstanding,
    }


__all__ = [
    "LoanFilters",
    "create_with_schedule",
    "get_for_user",
    "get_late_fee_configuration",
    "list_for_user",
    "list_installments",
    "loan_metrics",
]
