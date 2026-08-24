"""Phase 8 — Collections API tests (ROADMAP §12, PRODUCT_SPEC §29-30,
TESTING.md SS37). Verifies today view, day summary math, all filters,
projected late fees staying read-only and strict isolation."""

import calendar
from datetime import date, timedelta

from fastapi.testclient import TestClient
from decimal import Decimal

API = "/api/v1"
TODAY = date.today()


def _auth(client: TestClient, email: str) -> dict[str, str]:
    response = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secure-password-123", "full_name": "Lender"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _loan(
    client: TestClient,
    headers: dict,
    *,
    principal="100000.00",
    installments=1,
    first_due: date | None = None,
    late_fee=None,
) -> str:
    client_id = client.post(
        f"{API}/clients", json={"full_name": "Borrower"}, headers=headers
    ).json()["id"]

    effective_first_due = first_due or TODAY + timedelta(days=30)
    payload = {
        "client_id": client_id,
        "principal": principal,
        # Keep first_due >= start (LOAN_RULES SS26): backdate both together.
        "start_date": min(TODAY, effective_first_due).isoformat(),
        "first_due_date": effective_first_due.isoformat(),
        "interest_rate": "10",
        "interest_period": "MONTHLY",
        "amortization_type": "FIXED_PRINCIPAL",
        "payment_frequency": "MONTHLY",
        "number_of_installments": installments,
    }
    if late_fee:
        payload["late_fee_configuration"] = late_fee

    loan = client.post(f"{API}/loans", json=payload, headers=headers).json()
    return loan["id"]


def _pay(client: TestClient, headers: dict, loan_id: str, amount: str) -> None:
    response = client.post(
        f"{API}/loans/{loan_id}/payments",
        json={
            "amount": amount,
            "payment_date": TODAY.isoformat(),
            "payment_method": "CASH",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text


def test_today_view_includes_due_today_and_overdue_only(client: TestClient) -> None:
    headers = _auth(client, "collector1@example.com")

    due_today = _loan(client, headers, first_due=TODAY)
    overdue = _loan(client, headers, first_due=TODAY - timedelta(days=5))
    future = _loan(client, headers, first_due=TODAY + timedelta(days=10))

    response = client.get(f"{API}/collections/today", headers=headers).json()

    included_loans = {item["loan_id"] for item in response["items"]}
    assert due_today in included_loans
    assert overdue in included_loans
    assert future not in included_loans

    classifications = {
        item["loan_id"]: item["classification"] for item in response["items"]
    }
    assert classifications[due_today] == "DUE_TODAY"
    assert classifications[overdue] == "OVERDUE"

    overdue_item = next(i for i in response["items"] if i["loan_id"] == overdue)
    assert overdue_item["days_overdue"] == 5


def test_today_summary_math_with_partial_collection(client: TestClient) -> None:
    """SS50: expected/collected/pending/overdue reconcile from real data."""
    headers = _auth(client, "collector2@example.com")

    due_today = _loan(
        client,
        headers,
        principal="100000.00",
        first_due=TODAY,
        late_fee={  # overdue-style config irrelevant here; fee only for overdue
            "enabled": True,
            "type": "FIXED_AMOUNT",
            "value": "1000.00",
            "grace_period_days": 0,
        },
    )
    # Pay part of the due-today installment earlier today.
    _pay(client, headers, due_today, "40000.00")

    response = client.get(f"{API}/collections/today", headers=headers).json()
    summary = response["summary"]

    # Installment total was 110000; 40000 already collected.
    assert Decimal(summary["expected_today"]) == Decimal("110000.00")
    assert Decimal(summary["collected_today"]) == Decimal("40000.00")
    assert Decimal(summary["pending_today"]) == Decimal("70000.00")


def test_filters_cover_week_month_upcoming_all(client: TestClient) -> None:
    headers = _auth(client, "collector3@example.com")

    # Deterministic anchors.
    monday = TODAY.fromordinal(TODAY.toordinal() - TODAY.weekday())
    in_week = _loan(client, headers, first_due=monday + timedelta(days=1))

    last_day = calendar.monthrange(TODAY.year, TODAY.month)[1]
    has_future_this_month = TODAY.day <= last_day - 2
    in_month = _loan(
        client, headers, first_due=TODAY + timedelta(days=2)
    ) if has_future_this_month else None

    next_month_start = date(
        TODAY.year + (TODAY.month == 12), (TODAY.month % 12) + 1, 1
    )
    far_future = _loan(client, headers, first_due=next_month_start)

    week = client.get(f"{API}/collections?filter=THIS_WEEK", headers=headers).json()
    month = client.get(f"{API}/collections?filter=THIS_MONTH", headers=headers).json()
    upcoming = client.get(f"{API}/collections?filter=UPCOMING", headers=headers).json()
    everything = client.get(f"{API}/collections?filter=ALL", headers=headers).json()

    def loan_ids(payload):  # type: ignore[no-untyped-def]
        return {i["loan_id"] for i in payload["items"]}

    assert in_week in loan_ids(week)
    assert far_future not in loan_ids(month)

    if in_month is not None:
        assert in_month in loan_ids(month)      # still inside current month
        assert in_month in loan_ids(upcoming)   # future-dated -> UPCOMING
        assert in_month in loan_ids(everything)

    assert far_future in loan_ids(upcoming)
    assert {in_week, far_future} <= loan_ids(everything)


def test_invalid_filter_rejected(client: TestClient) -> None:
    headers = _auth(client, "collector4@example.com")

    response = client.get(f"{API}/collections?filter=YESTERDAY", headers=headers)

    assert response.status_code == 422


def test_projected_late_fee_readonly_until_payment(client: TestClient) -> None:
    """Collections may project the fee; persisted state changes only when a
    payment is registered (read-only GET contract)."""
    headers = _auth(client, "collector5@example.com")
    overdue = _loan(
        client,
        headers,
        principal="100000.00",
        installments=1,
        first_due=TODAY - timedelta(days=6),
        late_fee={
            "enabled": True,
            "type": "FIXED_AMOUNT",
            "value": "8000.00",
            "grace_period_days": 2,
        },
    )

    collections = client.get(f"{API}/collections?filter=OVERDUE", headers=headers).json()
    item = next(i for i in collections["items"] if i["loan_id"] == overdue)

    assert Decimal(item["late_fee_projected"]) == Decimal("8000.00")

    schedule = client.get(f"{API}/loans/{overdue}/schedule", headers=headers).json()
    assert schedule["installments"][0]["late_fee_due"] == "0.00"  # still unapplied

    # Registering a payment applies the fee and it becomes authoritative.
    payment_response = client.post(
        f"{API}/loans/{overdue}/payments",
        json={
            "amount": "50000.00",
            "payment_date": TODAY.isoformat(),
            "payment_method": "CASH",
        },
        headers=headers,
    ).json()
    assert Decimal(payment_response["allocation"]["late_fee"]) == Decimal("8000.00")


def test_paid_installments_excluded_from_collections(client: TestClient) -> None:
    headers = _auth(client, "collector6@example.com")
    paid_loan = _loan(client, headers, principal="100000.00", installments=1, first_due=TODAY - timedelta(days=2))
    _pay(client, headers, paid_loan, "110000.00")  # full payment incl. interest

    everything = client.get(f"{API}/collections?filter=ALL", headers=headers).json()

    assert paid_loan not in {i["loan_id"] for i in everything["items"]}


def test_client_filter_and_isolation(client: TestClient) -> None:
    owner = _auth(client, "c-owner@example.com")
    intruder = _auth(client, "c-intruder@example.com")

    other_client = client.post(
        f"{API}/clients", json={"full_name": "Visible"}, headers=owner
    ).json()["id"]
    loan = _loan(client, owner, first_due=TODAY)

    by_client = client.get(
        f"{API}/collections?filter=ALL&client_id={other_client}", headers=owner
    ).json()
    assert by_client["items"] == []  # different customer has no obligations

    intruder_view = client.get(f"{API}/collections?filter=ALL", headers=intruder)
    assert intruder_view.status_code == 200
    assert loan not in {i["loan_id"] for i in intruder_view.json()["items"]}
