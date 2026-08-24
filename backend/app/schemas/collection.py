from datetime import date
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import format_money


class CollectionClassification:
    """Presentation/collection labels (PAYMENT_RULES.md §52): they NEVER
    replace the authoritative installment statuses."""

    DUE_TODAY = "DUE_TODAY"
    OVERDUE = "OVERDUE"
    UPCOMING = "UPCOMING"


class CollectionItemResponse(BaseModel):
    installment_id: UUID
    loan_id: UUID
    client_id: UUID
    client_name: str
    installment_number: int
    due_date: date
    days_overdue: int
    classification: str
    installment_status: str  # authoritative backend status
    principal_outstanding: str
    interest_outstanding: str
    # Projected late fee (calculator applied on read; it becomes official
    # state only when a payment is registered against the installment).
    late_fee_projected: str
    total_paid: str
    total_outstanding: str


class TodayCollectionsSummary(BaseModel):
    expected_today: str
    collected_today: str
    pending_today: str
    overdue: str


class TodayCollectionsResponse(BaseModel):
    business_date: date
    summary: TodayCollectionsSummary
    items: list[CollectionItemResponse]


class CollectionsListResponse(BaseModel):
    business_date: date
    filter: str
    items: list[CollectionItemResponse]


def build_item(
    *,
    installment_id: UUID,
    loan_id: UUID,
    client_id: UUID,
    client_name: str,
    installment_number: int,
    due_date: date,
    days_overdue_value: int,
    classification: str,
    installment_status: str,
    principal_outstanding,
    interest_outstanding,
    late_fee_projected,
    total_paid,
    total_outstanding,
) -> CollectionItemResponse:  # type: ignore[no-untyped-def]
    return CollectionItemResponse(
        installment_id=installment_id,
        loan_id=loan_id,
        client_id=client_id,
        client_name=client_name,
        installment_number=installment_number,
        due_date=due_date,
        days_overdue=days_overdue_value,
        classification=classification,
        installment_status=installment_status,
        principal_outstanding=format_money(principal_outstanding),
        interest_outstanding=format_money(interest_outstanding),
        late_fee_projected=format_money(late_fee_projected),
        total_paid=format_money(total_paid),
        total_outstanding=format_money(total_outstanding),
    )
