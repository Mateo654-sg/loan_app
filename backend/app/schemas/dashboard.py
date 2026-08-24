from pydantic import BaseModel

from app.schemas.common import format_money
from app.schemas.finance import GoalResponse


class FinanceOverview(BaseModel):
    currency: str
    balance: str
    monthly_income: str
    monthly_expenses: str


class LoansOverview(BaseModel):
    total_capital_lent: str
    outstanding_capital: str
    generated_interest: str
    collected_interest: str
    today_collections_expected: str
    today_collections_pending: str
    total_receivable: str
    total_overdue: str


class DashboardResponse(BaseModel):
    business_date: str
    finance: FinanceOverview
    loans: LoansOverview
    goals: list[GoalResponse]

    @classmethod
    def build(
        cls,
        *,
        business_date,
        currency: str,
        balance,
        monthly_income,
        monthly_expenses,
        total_capital_lent,
        outstanding_capital,
        generated_interest,
        collected_interest,
        today_collections_expected,
        today_collections_pending,
        total_receivable,
        total_overdue,
        goals: list[GoalResponse],
    ) -> "DashboardResponse":
        return cls(
            business_date=business_date.isoformat(),
            finance=FinanceOverview(
                currency=currency,
                balance=format_money(balance),
                monthly_income=format_money(monthly_income),
                monthly_expenses=format_money(monthly_expenses),
            ),
            loans=LoansOverview(
                total_capital_lent=format_money(total_capital_lent),
                outstanding_capital=format_money(outstanding_capital),
                generated_interest=format_money(generated_interest),
                collected_interest=format_money(collected_interest),
                today_collections_expected=format_money(today_collections_expected),
                today_collections_pending=format_money(today_collections_pending),
                total_receivable=format_money(total_receivable),
                total_overdue=format_money(total_overdue),
            ),
            goals=goals,
        )
