from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.finance import (
    ContributionCreate,
    ContributionResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
)
from app.services import finance_service

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalResponse])
def list_goals(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    goal_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(ACTIVE|COMPLETED|CANCELLED)$",
    ),
) -> list[GoalResponse]:
    goals = finance_service.list_goals(db, user.id, status_filter=goal_status)

    return [finance_service.get_goal_progress_for(goal, db) for goal in goals]


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GoalResponse:
    goal = finance_service.create_goal(db, user.id, payload)
    return GoalResponse.from_model(goal, current_amount=Decimal(0))


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GoalResponse:
    return finance_service.get_goal_with_progress(db, user.id, goal_id)


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: UUID,
    payload: GoalUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GoalResponse:
    return finance_service.update_goal(db, user.id, goal_id, payload)


@router.post("/{goal_id}/cancel", response_model=GoalResponse)
def cancel_goal(
    goal_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GoalResponse:
    goal = finance_service.cancel_goal(db, user.id, goal_id)
    current = finance_service.goal_current_amount(db, goal)
    return GoalResponse.from_model(goal, current)


@router.get("/{goal_id}/contributions", response_model=list[ContributionResponse])
def list_contributions(
    goal_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ContributionResponse]:
    return finance_service.list_goal_contributions(db, user.id, goal_id)


@router.post(
    "/{goal_id}/contributions",
    response_model=ContributionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_contribution(
    goal_id: UUID,
    payload: ContributionCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ContributionResponse:
    return finance_service.create_contribution(db, user.id, goal_id, payload)


@router.post(
    "/{goal_id}/contributions/{contribution_id}/reverse",
    response_model=ContributionResponse,
)
def reverse_contribution(
    goal_id: UUID,
    contribution_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ContributionResponse:
    return finance_service.reverse_contribution(db, user.id, goal_id, contribution_id)
