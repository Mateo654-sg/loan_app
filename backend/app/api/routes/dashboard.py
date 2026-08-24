from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def dashboard(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DashboardResponse:
    """Aggregated read-model (API.md §51). It never duplicates financial
    rules: every value reuses the domain derivations."""
    return dashboard_service.get_dashboard(
        db,
        user.id,
        currency=user.currency,
        timezone_name=user.timezone or "America/Bogota",
    )
