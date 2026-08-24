"""Phase 6 — Loans API tests (ROADMAP §10).

Verifies that persisted schedules match the validated financial engine
exactly (official LOAN_RULES §61 example), creation validation, derived
metrics/status, cancellation and strict user isolation."""

from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select

API = "/api/v1"
TODAY = date.today()


def _auth(client: TestClient, email: str) -> dict[str, str]:
    response = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secure-password-123", "full_name": "Lender"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_client(client: TestClient, headers: dict) -> str:
    response = client.post(
        f"{API}/clients", json={"full_name": "Borrower One"}, headers=headers
    )
    return response.json()["id"]


_LOAN_BASE = {
    "principal": "1000000.00",
    "start_date": TODAY.isoformat(),
    "first_due_date": (TODAY + timedelta(days=30)).isoformat(),
    "interest_rate": "10",
    "interest_period": "MONTHLY",
    "amortization_type": "FIXED_PRINCIPAL",
    "payment_frequency": "MONTHLY",
    "number_of_installments": 10,
}


def _create_loan(
    client: TestClient,
    headers: dict,
    client_id: str,
    **overrides,
) -> dict:
    payload = {**_LOAN_BASE, "client_id": client_id, **overrides}
    response = client.post(f"{API}/loans", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------- creation & schedule ----------


def test_create_fixed_principal_loan_matches_engine_output(client: TestClient) -> None:
    """LOAN_RULES.md §61 example persisted exactly."""
    headers = _auth(client, "lender1@example.com")
    client_id = _create_client(client, headers)

    loan = _create_loan(client, headers, client_id)

    assert loan["status"] == "ACTIVE"
    assert loan["principal"] == "1000000.00"
    assert loan["outstanding_principal"] == "1000000.00"
    # Σ interest = 100k + 90k + ... + 10k = 550k (decreasing series, §61).
    assert loan["scheduled_interest"] == "550000.00"
    assert Decimal(loan["total_outstanding"]) == Decimal("1550000.00")

    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=headers).json()
    installments = schedule["installments"]

    assert len(installments) == 10
    assert [i["installment_number"] for i in installments] == list(range(1, 11))

    first, second = installments[0], installments[1]
    assert first["principal_due"] == "100000.00"
    assert first["interest_due"] == "100000.00"
    assert first["total_due"] == "200000.00"

    assert second["interest_due"] == "90000.00"
    assert second["total_due"] == "190000.00"

    # Paid components start at zero; remaining equals total at creation.
    assert all(
        i["principal_paid"] == "0.00" and i["remaining_balance"] == i["total_due"]
        for i in installments
    )


def test_create_french_loan_reconciles_and_persists_late_fee_config(client: TestClient) -> None:
    headers = _auth(client, "lender2@example.com")
    client_id = _create_client(client, headers)

    loan = _create_loan(
        client,
        headers,
        client_id,
        amortization_type="FRENCH",
        interest_rate="5",
        late_fee_configuration={
            "enabled": True,
            "type": "DAILY_PERCENTAGE",
            "value": "0.1",
            "grace_period_days": 3,
        },
    )

    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=headers).json()
    principals = [Decimal(i["principal_due"]) for i in schedule["installments"]]
    assert sum(principals) == Decimal("1000000.00")

    from app.db.session import SessionLocal
    from app.models.loan import LateFeeConfiguration

    with SessionLocal() as db:
        config = db.scalar(
            select(LateFeeConfiguration).where(LateFeeConfiguration.loan_id == loan["id"])
        )
    assert config is not None
    assert config.enabled is True
    assert config.type == "DAILY_PERCENTAGE"


def test_create_loan_records_audit_event(client: TestClient) -> None:
    headers = _auth(client, "lender3@example.com")
    client_id = _create_client(client, headers)
    loan = _create_loan(client, headers, client_id)

    from app.db.session import SessionLocal
    from app.models.audit import AuditLog

    with SessionLocal() as db:
        events = list(
            db.scalars(select(AuditLog).where(AuditLog.entity_id == loan["id"])).all()
        )
    assert len(events) == 1
    assert events[0].action == "CREATE_LOAN"


# ---------- creation validation ----------


def test_incompatible_pair_rejected(client: TestClient) -> None:
    headers = _auth(client, "validator@example.com")
    client_id = _create_client(client, headers)

    response = client.post(
        f"{API}/loans",
        json={**_LOAN_BASE, "client_id": client_id, "payment_frequency": "WEEKLY"},
        headers=headers,
    )

    assert response.status_code == 422


def test_once_frequency_forces_single_installment(client: TestClient) -> None:
    headers = _auth(client, "once-user@example.com")
    client_id = _create_client(client, headers)

    bad = client.post(
        f"{API}/loans",
        json={**_LOAN_BASE, "client_id": client_id, "payment_frequency": "ONCE"},
        headers=headers,
    )
    good = _create_loan(
        client,
        headers,
        client_id,
        payment_frequency="ONCE",
        number_of_installments=1,
        interest_period="MONTHLY",
    )

    assert bad.status_code == 422
    assert good["number_of_installments"] == 1

    schedule = client.get(f"{API}/loans/{good['id']}/schedule", headers=headers).json()
    assert len(schedule["installments"]) == 1
    assert schedule["installments"][0]["principal_due"] == "1000000.00"


def test_first_due_before_start_rejected(client: TestClient) -> None:
    headers = _auth(client, "dates@example.com")
    client_id = _create_client(client, headers)

    response = client.post(
        f"{API}/loans",
        json={
            **_LOAN_BASE,
            "client_id": client_id,
            "start_date": TODAY.isoformat(),
            "first_due_date": (TODAY - timedelta(days=1)).isoformat(),
        },
        headers=headers,
    )

    assert response.status_code == 422


def test_invalid_amounts_rejected(client: TestClient) -> None:
    headers = _auth(client, "amounts@example.com")
    client_id = _create_client(client, headers)

    zero = client.post(
        f"{API}/loans",
        json={**_LOAN_BASE, "client_id": client_id, "principal": "0.00"},
        headers=headers,
    )
    negative_rate = client.post(
        f"{API}/loans",
        json={**_LOAN_BASE, "client_id": client_id, "interest_rate": "-5"},
        headers=headers,
    )

    assert zero.status_code == 422
    assert negative_rate.status_code == 422


def test_foreign_client_returns_404_without_leaking(client: TestClient) -> None:
    other = _auth(client, "other-lender@example.com")
    foreign_client_id = _create_client(client, other)

    mine = _auth(client, "my-lender@example.com")
    response = client.post(
        f"{API}/loans", json={**_LOAN_BASE, "client_id": foreign_client_id}, headers=mine
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


# ---------- listing, filters, pagination ----------


def test_list_loans_filters_by_status_and_client(client: TestClient) -> None:
    headers = _auth(client, "lister@example.com")
    client_a = _create_client(client, headers)
    client_b = _create_client(client, headers)

    loan_a = _create_loan(client, headers, client_a)
    _create_loan(client, headers, client_b)

    by_client = client.get(f"{API}/loans?client_id={client_a}", headers=headers).json()
    assert by_client["pagination"]["total_items"] == 1
    assert by_client["items"][0]["client_name"] == "Borrower One"

    active = client.get(f"{API}/loans?status=ACTIVE", headers=headers).json()
    assert active["pagination"]["total_items"] == 2

    # Cancellation is reflected in status filtering.
    client.post(f"{API}/loans/{loan_a['id']}/cancel", headers=headers)
    after = client.get(f"{API}/loans?status=ACTIVE", headers=headers).json()
    cancelled = client.get(f"{API}/loans?status=CANCELLED", headers=headers).json()

    assert after["pagination"]["total_items"] == 1
    assert cancelled["pagination"]["total_items"] == 1


# ---------- cancellation ----------


def test_cancel_twice_conflicts_and_preserves_schedule(client: TestClient) -> None:
    headers = _auth(client, "canceller@example.com")
    client_id = _create_client(client, headers)
    loan = _create_loan(client, headers, client_id)

    first = client.post(f"{API}/loans/{loan['id']}/cancel", headers=headers)
    second = client.post(f"{API}/loans/{loan['id']}/cancel", headers=headers)

    assert first.status_code == 200
    assert first.json()["status"] == "CANCELLED"
    assert second.status_code == 409

    # History preserved: schedule remains accessible.
    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=headers)
    assert schedule.status_code == 200


# ---------- isolation & unknown ids ----------


def test_user_cannot_access_another_users_loan(client: TestClient) -> None:
    owner = _auth(client, "loan-owner@example.com")
    intruder = _auth(client, "loan-intruder@example.com")

    client_id = _create_client(client, owner)
    loan = _create_loan(client, owner, client_id)

    get = client.get(f"{API}/loans/{loan['id']}", headers=intruder)
    cancel = client.post(f"{API}/loans/{loan['id']}/cancel", headers=intruder)
    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=intruder)

    assert get.status_code == 404
    assert cancel.status_code == 404
    assert schedule.status_code == 404


def test_unknown_loan_id_returns_404(client: TestClient) -> None:
    from uuid import uuid4

    headers = _auth(client, "unknown-loan@example.com")

    assert client.get(f"{API}/loans/{uuid4()}", headers=headers).status_code == 404


# ---------- business date / timezone ----------


def test_business_date_uses_user_timezone(client: TestClient) -> None:
    from app.services.loan_service import business_today

    bogota = business_today("America/Bogota")
    tokyo = business_today("Asia/Tokyo")

    # Tokyo is ahead of Bogotá; dates must be computed per zone, never UTC-only.
    assert (tokyo - bogota).days in (0, 1)


def test_overdue_status_derived_from_backdated_schedule(client: TestClient) -> None:
    """A loan whose first installment fell due in the past reports OVERDUE;
    PAID cannot occur before payments exist (Phase 7)."""
    headers = _auth(client, "backdated@example.com")
    client_id = _create_client(client, headers)

    loan = _create_loan(
        client,
        headers,
        client_id,
        start_date=(TODAY - timedelta(days=70)).isoformat(),
        number_of_installments=2,
        first_due_date=(TODAY - timedelta(days=40)).isoformat(),
    )

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    assert detail["status"] == "OVERDUE"

    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=headers).json()
    statuses = [i["status"] for i in schedule["installments"]]
    assert "OVERDUE" in statuses
