"""Phase 9 — Dashboard API tests (ROADMAP §13, API.md §51).

Every metric is asserted against hand-computed values from seeded
scenarios; cancelled loans and future-dated transactions are excluded."""

from datetime import date, timedelta

from fastapi.testclient import TestClient
from decimal import Decimal

API = "/api/v1"
TODAY = date.today()


def _auth(client: TestClient, email: str) -> dict[str, str]:
    response = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secure-password-123", "full_name": "Owner"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _category(client: TestClient, headers: dict, type_: str) -> str:
    cats = client.get(f"{API}/categories?type={type_}", headers=headers).json()
    return next(c for c in cats if c["name"] == ("Salary" if type_ == "INCOME" else "Food"))["id"]


def _transaction(
    client: TestClient,
    headers: dict,
    *,
    category_id: str,
    amount: str,
    type_: str = "EXPENSE",
    transaction_date: date | None = None,
) -> None:
    response = client.post(
        f"{API}/transactions",
        json={
            "type": type_,
            "amount": amount,
            "category_id": category_id,
            "transaction_date": (transaction_date or TODAY).isoformat(),
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text


def _empty_dashboard(client: TestClient) -> dict:  # type: ignore[no-untyped-def]
    headers = _auth(client, "dash-empty@example.com")
    response = client.get(f"{API}/dashboard", headers=headers)
    assert response.status_code == 200
    return response.json()


# ---------- empty state ----------


def test_empty_dashboard_returns_zeroes_and_no_goals(client: TestClient) -> None:
    data = _empty_dashboard(client)

    assert data["business_date"] == TODAY.isoformat()
    assert data["finance"]["currency"] == "COP"
    assert data["finance"]["balance"] == "0.00"
    assert data["finance"]["monthly_income"] == "0.00"
    assert data["finance"]["monthly_expenses"] == "0.00"

    loans = data["loans"]
    assert all(Decimal(v) == 0 for v in loans.values())

    assert data["goals"] == []


# ---------- full scenario ----------


def test_dashboard_metrics_match_seeded_scenario(client: TestClient) -> None:
    headers = _auth(client, "dash-full@example.com")

    salary = _category(client, headers, "INCOME")
    food = _category(client, headers, "EXPENSE")

    # This month + previous month (excluded from monthly) + future (excluded from balance).
    _transaction(
        client, headers, category_id=salary, amount="3000000.00", type_="INCOME",
        transaction_date=TODAY.replace(day=1),
    )
    _transaction(
        client, headers, category_id=food, amount="500000.00",
        transaction_date=TODAY.replace(day=1),
    )
    last_month_end = TODAY.replace(day=1) - timedelta(days=1)
    _transaction(
        client, headers, category_id=salary, amount="777777.00", type_="INCOME",
        transaction_date=last_month_end,
    )
    _transaction(
        client, headers, category_id=salary, amount="123456.00", type_="INCOME",
        transaction_date=TODAY + timedelta(days=10),
    )

    # Loan A: 1 installment due today, partially collected today.
    borrower = client.post(f"{API}/clients", json={"full_name": "A"}, headers=headers).json()["id"]
    loan_a = client.post(
        f"{API}/loans",
        json={
            "client_id": borrower,
            "principal": "100000.00",
            "start_date": TODAY.isoformat(),
            "first_due_date": TODAY.isoformat(),
            "interest_rate": "10",
            "interest_period": "MONTHLY",
            "amortization_type": "FIXED_PRINCIPAL",
            "payment_frequency": "ONCE",
            "number_of_installments": 1,
        },
        headers=headers,
    ).json()
    # Pay 60000 today: interest 10000 + principal 50000.
    pay_a = client.post(
        f"{API}/loans/{loan_a['id']}/payments",
        json={
            "amount": "60000.00",
            "payment_date": TODAY.isoformat(),
            "payment_method": "CASH",
        },
        headers=headers,
    )
    assert pay_a.status_code == 201, pay_a.text

    # Loan B: overdue by construction (due 5 days ago), untouched.
    borrower_b = client.post(f"{API}/clients", json={"full_name": "B"}, headers=headers).json()["id"]
    client.post(
        f"{API}/loans",
        json={
            "client_id": borrower_b,
            "principal": "200000.00",
            "start_date": (TODAY - timedelta(days=36)).isoformat(),
            "first_due_date": (TODAY - timedelta(days=5)).isoformat(),
            "interest_rate": "10",
            "interest_period": "MONTHLY",
            "amortization_type": "FIXED_PRINCIPAL",
            "payment_frequency": "ONCE",
            "number_of_installments": 1,
        },
        headers=headers,
    )

    # Loan C: cancelled — must be excluded from every portfolio metric.
    borrower_c = client.post(f"{API}/clients", json={"full_name": "C"}, headers=headers).json()["id"]
    loan_c_response = client.post(
        f"{API}/loans",
        json={
            "client_id": borrower_c,
            "principal": "900000.00",
            "start_date": TODAY.isoformat(),
            "first_due_date": TODAY.isoformat(),
            "interest_rate": "10",
            "interest_period": "MONTHLY",
            "amortization_type": "FIXED_PRINCIPAL",
            "payment_frequency": "ONCE",
            "number_of_installments": 1,
        },
        headers=headers,
    )
    loan_c = loan_c_response.json()
    cancel = client.post(f"{API}/loans/{loan_c['id']}/cancel", headers=headers)
    assert cancel.status_code == 200

    # Goal with one contribution.
    goal = client.post(
        f"{API}/goals",
        json={"name": "Fund", "target_amount": "1000000.00"},
        headers=headers,
    ).json()
    client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "250000.00", "contribution_date": TODAY.isoformat()},
        headers=headers,
    )
    # The payment's interest income (10k) also lands in finance.

    data = client.get(f"{API}/dashboard", headers=headers).json()

    finance = data["finance"]
    # Balance to date = income (3,000,000 this month-salary + 777,777 prev + 10,000 interest)
    #                  - expenses (500,000) ; future-dated 123,456 excluded.
    assert Decimal(finance["balance"]) == Decimal("3287777.00")
    assert Decimal(finance["monthly_income"]) == Decimal("3010000.00")  # salary + interest
    assert Decimal(finance["monthly_expenses"]) == Decimal("500000.00")

    loans = data["loans"]
    assert Decimal(loans["total_capital_lent"]) == Decimal("300000.00")   # A+B; C excluded
    assert Decimal(loans["outstanding_capital"]) == Decimal("250000.00")  # A 50k left + B 200k
    assert Decimal(loans["generated_interest"]) == Decimal("300000.00".replace("300000.00", "30000.00"))
    assert Decimal(loans["collected_interest"]) == Decimal("10000.00")
    # A: 50k principal left (interest fully collected); B: 220k untouched.
    assert Decimal(loans["total_receivable"]) == Decimal("270000.00")
    assert Decimal(loans["total_overdue"]) == Decimal("220000.00")        # B principal+interest

    # Today's collections: only loan A is due today.
    assert Decimal(loans["today_collections_expected"]) == Decimal("110000.00")
    assert Decimal(loans["today_collections_pending"]) == Decimal("50000.00")

    goals = data["goals"]
    assert len(goals) == 1
    assert goals[0]["current_amount"] == "250000.00"
    assert goals[0]["progress_percent"] == 25


def test_dashboard_is_isolated_per_user(client: TestClient) -> None:
    owner = _auth(client, "iso9-owner@example.com")
    client_id = client.post(
        f"{API}/clients", json={"full_name": "Secret"}, headers=owner
    ).json()["id"]
    client.post(
        f"{API}/loans",
        json={
            "client_id": client_id,
            "principal": "500000.00",
            "start_date": TODAY.isoformat(),
            "first_due_date": TODAY.isoformat(),
            "interest_rate": "10",
            "interest_period": "MONTHLY",
            "amortization_type": "FIXED_PRINCIPAL",
            "payment_frequency": "ONCE",
            "number_of_installments": 1,
        },
        headers=owner,
    )

    intruder = _auth(client, "iso9-intruder@example.com")
    data = client.get(f"{API}/dashboard", headers=intruder).json()

    assert Decimal(data["loans"]["total_capital_lent"]) == Decimal("0.00")
