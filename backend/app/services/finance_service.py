import uuid

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.category import Category, Transaction
from app.models.goal import FinancialGoal, GoalContribution
from app.models.user import User
from app.repositories import finance_repository, goal_repository
from app.repositories.finance_repository import TransactionFilters
from app.schemas.common import format_money
from app.schemas.finance import (
    CategoryCreate,
    CategoryUpdate,
    ContributionCreate,
    ContributionResponse,
    FinanceSummaryResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    TransactionCreate,
    TransactionUpdate,
)

DEFAULT_INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Business",
    "Interest",
    "Other",
]

DEFAULT_EXPENSE_CATEGORIES = [
    "Food",
    "Transportation",
    "Housing",
    "Utilities",
    "Education",
    "Health",
    "Entertainment",
    "Shopping",
    "Technology",
    "Debt",
    "Other",
]


# ---------- Categories ----------


def seed_default_categories(db: Session, user: User) -> None:
    """Seed initial categories on account creation (DATABASE.md §55).

    Runs inside the registration transaction; commits are owned by the caller.
    """
    for name in DEFAULT_INCOME_CATEGORIES:
        db.add(Category(user_id=user.id, name=name, type="INCOME"))
    for name in DEFAULT_EXPENSE_CATEGORIES:
        db.add(Category(user_id=user.id, name=name, type="EXPENSE"))
    db.flush()


def list_categories(
    db: Session,
    user_id: uuid.UUID,
    *,
    type_filter: str | None = None,
    is_active: bool | None = None,
) -> list[Category]:
    return finance_repository.list_for_user(db, user_id, type_filter=type_filter, is_active=is_active)


def create_category(db: Session, user_id: uuid.UUID, payload: CategoryCreate) -> Category:
    if finance_repository.find_by_name(db, user_id, payload.name, payload.type) is not None:
        raise AppError(
            code="CATEGORY_ALREADY_EXISTS",
            message="An active category with this name and type already exists.",
            http_status=409,
        )

    category = Category(user_id=user_id, name=payload.name, type=payload.type)
    finance_repository.add(db, category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session, user_id: uuid.UUID, category_id: uuid.UUID, payload: CategoryUpdate
) -> Category:
    category = _get_category_or_404(db, category_id, user_id)

    duplicate = finance_repository.find_by_name(db, user_id, payload.name, category.type)
    if duplicate is not None and duplicate.id != category.id:
        raise AppError(
            code="CATEGORY_ALREADY_EXISTS",
            message="An active category with this name and type already exists.",
            http_status=409,
        )

    category.name = payload.name
    db.commit()
    db.refresh(category)
    return category


def deactivate_category(db: Session, user_id: uuid.UUID, category_id: uuid.UUID) -> Category:
    """Soft deactivation: historical transactions keep their reference."""
    category = _get_category_or_404(db, category_id, user_id)

    if not category.is_active:
        raise AppError(
            code="CATEGORY_ALREADY_INACTIVE",
            message="Category is already inactive.",
            http_status=409,
        )

    category.is_active = False
    db.commit()
    db.refresh(category)
    return category


def _get_category_or_404(db: Session, category_id: uuid.UUID, user_id: uuid.UUID) -> Category:
    category = finance_repository.get_for_user(db, category_id, user_id)
    if category is None:
        # 404 without revealing whether another user owns it (API.md §66).
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)
    return category


# ---------- Transactions ----------


def create_transaction(db: Session, user_id: uuid.UUID, payload: TransactionCreate) -> Transaction:
    category = _get_category_or_404(db, payload.category_id, user_id)

    if not category.is_active:
        raise AppError(
            code="CATEGORY_INACTIVE",
            message="This category is inactive and cannot be used for new transactions.",
            http_status=409,
        )

    if category.type != payload.type:
        raise AppError(
            code="CATEGORY_TYPE_MISMATCH",
            message=f"A {category.type} category cannot be used for a {payload.type} transaction.",
            http_status=422,
        )

    transaction = Transaction(
        user_id=user_id,
        category_id=category.id,
        type=payload.type,
        amount=payload.amount,
        transaction_date=payload.transaction_date,
        description=payload.description,
        payment_method=payload.payment_method,
        notes=payload.notes,
    )
    finance_repository.add_transaction(db, transaction)

    from app.core.audit import record_audit

    record_audit(
        db,
        user_id=user_id,
        action="CREATE_TRANSACTION",
        entity_type="transaction",
        entity_id=transaction.id,
        metadata={
            "type": payload.type,
            "amount": format_money(payload.amount),
            "category_id": str(category.id),
        },
    )

    db.commit()
    db.refresh(transaction)
    return transaction


def list_transactions(
    db: Session,
    user_id: uuid.UUID,
    filters: TransactionFilters,
    *,
    page: int,
    page_size: int,
) -> tuple[list[Transaction], int]:
    return finance_repository.list_transactions(
        db, user_id, filters, page=page, page_size=page_size
    )


def get_transaction(db: Session, user_id: uuid.UUID, transaction_id: uuid.UUID) -> Transaction:
    transaction = finance_repository.get_transaction_for_user(db, transaction_id, user_id)
    if transaction is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)
    return transaction


def update_transaction(
    db: Session, user_id: uuid.UUID, transaction_id: uuid.UUID, payload: TransactionUpdate
) -> Transaction:
    transaction = get_transaction(db, user_id, transaction_id)

    if transaction.status == "CANCELLED":
        raise AppError(
            code="INVALID_STATE",
            message="Cancelled transactions cannot be modified.",
            http_status=409,
        )

    if payload.category_id is not None and payload.category_id != transaction.category_id:
        category = _get_category_or_404(db, payload.category_id, user_id)
        if not category.is_active:
            raise AppError(
                code="CATEGORY_INACTIVE",
                message="This category is inactive.",
                http_status=409,
            )
        if category.type != transaction.type:
            raise AppError(
                code="CATEGORY_TYPE_MISMATCH",
                message=f"A {category.type} category cannot be used for a {transaction.type} transaction.",
                http_status=422,
            )
        transaction.category_id = category.id

    if payload.amount is not None:
        transaction.amount = payload.amount
    if payload.transaction_date is not None:
        transaction.transaction_date = payload.transaction_date
    if payload.description is not None:
        transaction.description = payload.description
    if payload.payment_method is not None:
        transaction.payment_method = payload.payment_method
    if payload.notes is not None:
        transaction.notes = payload.notes

    from app.core.audit import record_audit

    record_audit(
        db,
        user_id=user_id,
        action="UPDATE_TRANSACTION",
        entity_type="transaction",
        entity_id=transaction.id,
        metadata={"fields": list(payload.model_dump(exclude_unset=True).keys())},
    )

    db.commit()
    db.refresh(transaction)
    return transaction


def cancel_transaction(db: Session, user_id: uuid.UUID, transaction_id: uuid.UUID) -> Transaction:
    """Cancellation instead of deletion (FINANCIAL_RULES.md §14)."""
    transaction = get_transaction(db, user_id, transaction_id)

    if transaction.status == "CANCELLED":
        raise AppError(
            code="TRANSACTION_ALREADY_CANCELLED",
            message="Transaction is already cancelled.",
            http_status=409,
        )

    transaction.status = "CANCELLED"

    from app.core.audit import record_audit

    record_audit(
        db,
        user_id=user_id,
        action="CANCEL_TRANSACTION",
        entity_type="transaction",
        entity_id=transaction.id,
        metadata={"amount": format_money(transaction.amount)},
    )

    db.commit()
    db.refresh(transaction)
    return transaction


# ---------- Finance summary ----------


def get_finance_summary(
    db: Session,
    user: User,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
) -> FinanceSummaryResponse:
    income, expenses = finance_repository.sum_amounts(
        db, user.id, start_date=start_date, end_date=end_date
    )
    return FinanceSummaryResponse.build(currency=user.currency, income=income, expenses=expenses)


# ---------- Goals ----------


def create_goal(db: Session, user_id: uuid.UUID, payload: GoalCreate):

    goal = FinancialGoal(
        user_id=user_id,
        name=payload.name,
        target_amount=payload.target_amount,
        target_date=payload.target_date,
        description=payload.description,
    )
    goal_repository.add(db, goal)
    db.commit()
    db.refresh(goal)
    return goal


def list_goals(
    db: Session, user_id: uuid.UUID, *, status_filter: str | None = None
) -> list[FinancialGoal]:
    return goal_repository.list_for_user(db, user_id, status=status_filter)


def get_goal_with_progress(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> GoalResponse:

    goal = goal_repository.get_for_user(db, goal_id, user_id)
    if goal is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    current_amount = goal_repository.sum_active_contributions(db, goal.id)
    return GoalResponse.from_model(goal, current_amount)


def update_goal(
    db: Session, user_id: uuid.UUID, goal_id: uuid.UUID, payload: GoalUpdate
) -> GoalResponse:
    goal = goal_repository.get_for_user(db, goal_id, user_id)
    if goal is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    if goal.status == "CANCELLED":
        raise AppError(
            code="INVALID_STATE",
            message="Cancelled goals cannot be modified.",
            http_status=409,
        )

    if payload.name is not None:
        goal.name = payload.name
    if payload.target_amount is not None:
        goal.target_amount = payload.target_amount
        _reevaluate_completion(db, goal)
    if payload.target_date is not None:
        goal.target_date = payload.target_date
    if payload.description is not None:
        goal.description = payload.description

    db.commit()
    db.refresh(goal)
    current_amount = goal_repository.sum_active_contributions(db, goal.id)


    return GoalResponse.from_model(goal, current_amount)


def cancel_goal(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> FinancialGoal:
    goal = goal_repository.get_for_user(db, goal_id, user_id)
    if goal is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    if goal.status == "CANCELLED":
        raise AppError(
            code="GOAL_ALREADY_CANCELLED",
            message="Goal is already cancelled.",
            http_status=409,
        )

    goal.status = "CANCELLED"
    db.commit()
    return goal


def create_contribution(
    db: Session, user_id: uuid.UUID, goal_id: uuid.UUID, payload: ContributionCreate
) -> ContributionResponse:

    goal = goal_repository.get_for_user(db, goal_id, user_id)
    if goal is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    if goal.status == "CANCELLED":
        raise AppError(
            code="INVALID_STATE",
            message="Contributions cannot be added to a cancelled goal.",
            http_status=409,
        )

    contribution = GoalContribution(
        goal_id=goal.id,
        amount=payload.amount,
        contribution_date=payload.contribution_date,
        description=payload.description,
    )
    goal_repository.add_contribution(db, contribution)

    _reevaluate_completion(db, goal)

    from app.core.audit import record_audit

    record_audit(
        db,
        user_id=user_id,
        action="CREATE_GOAL_CONTRIBUTION",
        entity_type="goal_contribution",
        entity_id=contribution.id,
        metadata={"goal_id": str(goal.id), "amount": format_money(payload.amount)},
    )

    db.commit()
    db.refresh(contribution)
    return ContributionResponse.from_model(contribution)


def reverse_contribution(
    db: Session, user_id: uuid.UUID, goal_id: uuid.UUID, contribution_id: uuid.UUID
) -> ContributionResponse:
    """Reversal keeps the original record (FINANCIAL_RULES.md §22)."""

    goal = goal_repository.get_for_user(db, goal_id, user_id)
    if goal is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    contribution = goal_repository.get_contribution_for_goal(db, contribution_id, goal.id)
    if contribution is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)

    if contribution.status == "CANCELLED":
        raise AppError(
            code="CONTRIBUTION_ALREADY_REVERSED",
            message="Contribution is already reversed.",
            http_status=409,
        )

    contribution.status = "CANCELLED"

    # Flush so the recalculation below sees the cancelled contribution
    # (session uses autoflush=False).
    db.flush()
    _reevaluate_completion(db, goal)

    from app.core.audit import record_audit

    record_audit(
        db,
        user_id=user_id,
        action="REVERSE_GOAL_CONTRIBUTION",
        entity_type="goal_contribution",
        entity_id=contribution.id,
        metadata={"goal_id": str(goal.id), "amount": format_money(contribution.amount)},
    )

    db.commit()
    db.refresh(contribution)
    return ContributionResponse.from_model(contribution)


def goal_current_amount(db: Session, goal: FinancialGoal) -> Decimal:
    """Derived accumulated amount = SUM(active contributions) (DATABASE.md §17)."""
    return goal_repository.sum_active_contributions(db, goal.id)


def get_goal_progress_for(goal: FinancialGoal, db: Session) -> GoalResponse:
    return GoalResponse.from_model(goal, goal_repository.sum_active_contributions(db, goal.id))


def _reevaluate_completion(db: Session, goal: FinancialGoal) -> None:
    """A goal is completed when current >= target (FINANCIAL_RULES.md §19)."""
    current_amount = goal_repository.sum_active_contributions(db, goal.id)

    if goal.status == "ACTIVE" and current_amount >= goal.target_amount:
        goal.status = "COMPLETED"
    elif goal.status == "COMPLETED" and current_amount < goal.target_amount:
        goal.status = "ACTIVE"


def list_goal_contributions(
    db: Session, user_id: uuid.UUID, goal_id: uuid.UUID
) -> list[ContributionResponse]:
    goal = goal_repository.get_for_user(db, goal_id, user_id)
    if goal is None:
        raise AppError(code="RESOURCE_NOT_FOUND", message="Resource not found.", http_status=404)


    contributions = goal_repository.list_contributions(db, goal.id)
    return [ContributionResponse.from_model(c) for c in contributions]
