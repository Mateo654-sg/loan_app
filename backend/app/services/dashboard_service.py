"""Consolidated dashboard read-model (API.md §51, ROADMAP §13).

Pure aggregation over authoritative persisted data. It must not redefine
financial rules: every number here comes from the same derivations used
by the domain endpoints.
"""
import calendar
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Transaction
from app.models.loan import Loan, LoanInstallment
from app.models.payment import LoanPayment
from app.repositories import goal_repository
from app.schemas.dashboard import DashboardResponse
from app.schemas.finance import GoalResponse
from app.services.collection_service import _compute_items
from app.services.finance_service import get_goal_progress_for
from app.services.loan_service import business_today


def get_dashboard(db: Session, user_id: uuid.UUID, currency: str, timezone_name: str) -> DashboardResponse:
    today = business_today(timezone_name)
    month_start = today.replace(day=1)
    month_end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])

    # ---------- personal finance ----------
    balance_income, balance_expenses = _balance_to_date(db, user_id, today)
    monthly_income, monthly_expenses = _sum_range(db, user_id, month_start, month_end)

    # ---------- loan portfolio ----------
    portfolio = _portfolio_totals(db, user_id)

    # ---------- collections (reuses the official collections derivation) ----------
    items = _compute_items(db, user_id, timezone_name)
    from app.schemas.collection import CollectionClassification

    expected_today = sum(
        (
            i.total_due_scheduled
            for i in items
            if i.classification == CollectionClassification.DUE_TODAY
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
    collected_today = sum((Decimal(a) for a in collected_rows), Decimal(0))
    pending_today = max(expected_today - collected_today, Decimal(0))

    total_overdue = sum(
        (
            i.total_outstanding
            for i in items
            if i.classification == CollectionClassification.OVERDUE
        ),
        Decimal(0),
    )

    # ---------- goals ----------
    goals_rows = goal_repository.list_for_user(db, user_id, status=None)
    goals = [get_goal_progress_for(goal, db) for goal in goals_rows if goal.status != "CANCELLED"]

    return DashboardResponse.build(
        business_date=today,
        currency=currency,
        balance=balance_income - balance_expenses,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        total_capital_lent=portfolio["total_capital_lent"],
        outstanding_capital=portfolio["outstanding_principal"],
        generated_interest=portfolio["scheduled_interest"],
        collected_interest=portfolio["collected_interest"],
        today_collections_expected=expected_today,
        today_collections_pending=pending_today,
        total_receivable=portfolio["total_receivable"],
        total_overdue=total_overdue,
        goals=goals,
    )


# ---------- internals ----------


def _balance_to_date(db: Session, user_id: uuid.UUID, today: date) -> tuple[Decimal, Decimal]:
    """All-time balance using transactions up to today inclusive
    (FINANCIAL_RULES §7/§9)."""
    rows = db.execute(
        select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.user_id == user_id,
            Transaction.status == "ACTIVE",
            Transaction.transaction_date <= today,
        )
        .group_by(Transaction.type)
    ).all()
    totals = {row[0]: row[1] for row in rows}
    return totals.get("INCOME", Decimal(0)), totals.get("EXPENSE", Decimal(0))


def _sum_range(db: Session, user_id: uuid.UUID, start: date, end: date) -> tuple[Decimal, Decimal]:
    rows = db.execute(
        select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.user_id == user_id,
            Transaction.status == "ACTIVE",
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .group_by(Transaction.type)
    ).all()
    totals = {row[0]: row[1] for row in rows}
    return totals.get("INCOME", Decimal(0)), totals.get("EXPENSE", Decimal(0))


def _portfolio_totals(db: Session, user_id: uuid.UUID) -> dict[str, Decimal]:
    """Aggregate over non-cancelled loans and their installments.

    Cancelled loans are excluded entirely; their history remains accessible
    through their own endpoints."""
    principal_sum = db.scalar(
        select(func.coalesce(func.sum(Loan.principal), 0)).where(
            Loan.user_id == user_id, Loan.status != "CANCELLED"
        )
    )

    installment_totals = db.execute(
        select(
            func.coalesce(func.sum(LoanInstallment.principal_due - LoanInstallment.principal_paid), 0),
            func.coalesce(func.sum(LoanInstallment.interest_due), 0),
            func.coalesce(func.sum(LoanInstallment.interest_paid), 0),
            func.coalesce(func.sum(LoanInstallment.late_fee_due - LoanInstallment.late_fee_paid), 0),
        ).join(Loan, Loan.id == LoanInstallment.loan_id).where(
            Loan.user_id == user_id,
            Loan.status != "CANCELLED",
        )
    ).one()

    outstanding_principal = Decimal(installment_totals[0])
    scheduled_interest = Decimal(installment_totals[1])
    collected_interest = Decimal(installment_totals[2])
    outstanding_late_fees = Decimal(installment_totals[3])

    return {
        "total_capital_lent": Decimal(principal_sum or 0),
        "outstanding_principal": outstanding_principal,
        "scheduled_interest": scheduled_interest,
        "collected_interest": collected_interest,
        "total_receivable": outstanding_principal
        + max(scheduled_interest - collected_interest, Decimal(0))
        + outstanding_late_fees,
    }


__all__ = ["get_dashboard"]
