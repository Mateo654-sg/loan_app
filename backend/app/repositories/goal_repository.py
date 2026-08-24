import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.goal import FinancialGoal, GoalContribution


def list_for_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    status: str | None = None,
) -> list[FinancialGoal]:
    query = select(FinancialGoal).where(FinancialGoal.user_id == user_id)
    if status is not None:
        query = query.where(FinancialGoal.status == status)
    return list(db.scalars(query.order_by(FinancialGoal.created_at.desc())).all())


def get_for_user(db: Session, goal_id: uuid.UUID, user_id: uuid.UUID) -> FinancialGoal | None:
    return db.scalar(
        select(FinancialGoal).where(FinancialGoal.id == goal_id, FinancialGoal.user_id == user_id)
    )


def add(db: Session, goal: FinancialGoal) -> None:
    db.add(goal)
    db.flush()


def sum_active_contributions(db: Session, goal_id: uuid.UUID) -> Decimal:
    """Current amount = SUM(active contributions) (DATABASE.md §17)."""
    return Decimal(
        db.scalar(
            select(func.coalesce(func.sum(GoalContribution.amount), 0)).where(
                GoalContribution.goal_id == goal_id,
                GoalContribution.status == "ACTIVE",
            )
        )
        or 0
    )


def add_contribution(db: Session, contribution: GoalContribution) -> None:
    db.add(contribution)
    db.flush()


def list_contributions(
    db: Session,
    goal_id: uuid.UUID,
    *,
    include_cancelled: bool = True,
) -> list[GoalContribution]:
    query = select(GoalContribution).where(GoalContribution.goal_id == goal_id)
    if not include_cancelled:
        query = query.where(GoalContribution.status == "ACTIVE")
    return list(
        db.scalars(query.order_by(GoalContribution.contribution_date.desc(), GoalContribution.created_at.desc())).all()
    )


def get_contribution_for_goal(
    db: Session, contribution_id: uuid.UUID, goal_id: uuid.UUID
) -> GoalContribution | None:
    return db.scalar(
        select(GoalContribution).where(
            GoalContribution.id == contribution_id,
            GoalContribution.goal_id == goal_id,
        )
    )
