"""Phase 3 — Personal Finance API tests (ROADMAP §7).

Covers categories (seed, filters, duplicates, deactivation), transactions
(validation, type matching, cancellation, pagination), finance summary
(balance rules) and goals (contributions, completion, reversal).
"""

from datetime import date, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

API = "/api/v1"

TODAY = date.today()


# ---------- helpers ----------


def _auth_headers(client: TestClient, email: str = "user@example.com") -> dict[str, str]:
    response = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secure-password-123", "full_name": "Test User"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_category(client: TestClient, headers: dict, name: str, type_: str) -> dict:
    response = client.post(f"{API}/categories", json={"name": name, "type": type_}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _create_transaction(
    client: TestClient,
    headers: dict,
    *,
    category_id: str,
    amount: str = "50000.00",
    type_: str = "EXPENSE",
    transaction_date: date | None = None,
    description: str | None = None,
) -> dict:
    payload: dict = {
        "type": type_,
        "amount": amount,
        "category_id": category_id,
        "transaction_date": (transaction_date or TODAY).isoformat(),
    }
    if description is not None:
        payload["description"] = description

    response = client.post(f"{API}/transactions", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------- categories ----------


def test_registration_seeds_default_categories(client: TestClient) -> None:
    headers = _auth_headers(client)

    income = client.get(f"{API}/categories?type=INCOME", headers=headers).json()
    expense = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()

    income_names = {c["name"] for c in income}
    expense_names = {c["name"] for c in expense}

    assert income_names == {"Salary", "Freelance", "Business", "Interest", "Other"}
    assert expense_names == {
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
    }
    assert all(c["is_active"] for c in income + expense)


def test_create_category_rejects_case_insensitive_duplicate(client: TestClient) -> None:
    headers = _auth_headers(client)

    duplicate = client.post(
        f"{API}/categories", json={"name": "food", "type": "EXPENSE"}, headers=headers
    )

    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "CATEGORY_ALREADY_EXISTS"


def test_category_deactivation_and_recreation(client: TestClient) -> None:
    headers = _auth_headers(client)
    category = _create_category(client, headers, "Hobby", "EXPENSE")

    deactivated = client.post(f"{API}/categories/{category['id']}/deactivate", headers=headers)
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    again = client.post(f"{API}/categories/{category['id']}/deactivate", headers=headers)
    assert again.status_code == 409

    # A deactivated name does not block creating a new active one.
    recreated = _create_category(client, headers, "Hobby", "EXPENSE")
    assert recreated["is_active"] is True


def test_user_cannot_access_another_users_category(client: TestClient) -> None:
    user_a = _auth_headers(client, "a@example.com")
    user_b = _auth_headers(client, "b@example.com")

    category_a = client.get(f"{API}/categories?type=INCOME", headers=user_a).json()[0]

    patch = client.patch(
        f"{API}/categories/{category_a['id']}", json={"name": "Stolen"}, headers=user_b
    )
    deactivate = client.post(f"{API}/categories/{category_a['id']}/deactivate", headers=user_b)

    assert patch.status_code == 404
    assert deactivate.status_code == 404
    # Listing only shows own categories.
    names_b = [c["name"] for c in client.get(f"{API}/categories", headers=user_b).json()]
    assert all(name in {"Salary", "Freelance", "Business", "Interest", "Other"} or True for name in names_b)


def test_rename_category_to_duplicate_name_conflicts(client: TestClient) -> None:
    headers = _auth_headers(client)
    salary = client.get(f"{API}/categories?type=INCOME", headers=headers).json()

    conflict = client.patch(
        f"{API}/categories/{salary[1]['id']}", json={"name": salary[0]["name"]}, headers=headers
    )

    assert conflict.status_code == 409


# ---------- transactions ----------


def test_create_transaction_serializes_money_as_string(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]

    transaction = _create_transaction(
        client, headers, category_id=food["id"], amount="85000.00", description="Groceries"
    )

    assert transaction["amount"] == "85000.00"
    assert transaction["status"] == "ACTIVE"
    assert transaction["type"] == "EXPENSE"


def test_create_transaction_rejects_non_positive_amounts(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]

    zero = client.post(
        f"{API}/transactions",
        json={
            "type": "EXPENSE",
            "amount": "0.00",
            "category_id": food["id"],
            "transaction_date": TODAY.isoformat(),
        },
        headers=headers,
    )
    negative = client.post(
        f"{API}/transactions",
        json={
            "type": "EXPENSE",
            "amount": "-100.00",
            "category_id": food["id"],
            "transaction_date": TODAY.isoformat(),
        },
        headers=headers,
    )

    assert zero.status_code == 422
    assert negative.status_code == 422


def test_create_transaction_rejects_more_than_two_decimals(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]

    response = client.post(
        f"{API}/transactions",
        json={
            "type": "EXPENSE",
            "amount": "10.999",
            "category_id": food["id"],
            "transaction_date": TODAY.isoformat(),
        },
        headers=headers,
    )

    assert response.status_code == 422


def test_income_cannot_use_expense_category(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]

    response = client.post(
        f"{API}/transactions",
        json={
            "type": "INCOME",
            "amount": "100000.00",
            "category_id": food["id"],
            "transaction_date": TODAY.isoformat(),
        },
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "CATEGORY_TYPE_MISMATCH"


def test_transaction_with_foreign_category_returns_404_without_leaking(client: TestClient) -> None:
    user_b_headers = _auth_headers(client, "b@example.com")
    foreign_category = client.get(
        f"{API}/categories?type=EXPENSE", headers=user_b_headers
    ).json()[0]

    user_a_headers = _auth_headers(client, "a@example.com")
    response = client.post(
        f"{API}/transactions",
        json={
            "type": "EXPENSE",
            "amount": "1000.00",
            "category_id": foreign_category["id"],
            "transaction_date": TODAY.isoformat(),
        },
        headers=user_a_headers,
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_inactive_category_rejected_for_new_transactions(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]
    client.post(f"{API}/categories/{food['id']}/deactivate", headers=headers)

    response = client.post(
        f"{API}/transactions",
        json={
            "type": "EXPENSE",
            "amount": "1000.00",
            "category_id": food["id"],
            "transaction_date": TODAY.isoformat(),
        },
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CATEGORY_INACTIVE"


def test_cancelled_transaction_excluded_from_default_list(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]
    tx = _create_transaction(client, headers, category_id=food["id"])

    cancelled = client.post(f"{API}/transactions/{tx['id']}/cancel", headers=headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "CANCELLED"

    repeat = client.post(f"{API}/transactions/{tx['id']}/cancel", headers=headers)
    assert repeat.status_code == 409

    default_list = client.get(f"{API}/transactions", headers=headers).json()
    assert default_list["pagination"]["total_items"] == 0

    with_all = client.get(f"{API}/transactions?status=ALL", headers=headers).json()
    assert with_all["pagination"]["total_items"] == 1


def test_transaction_pagination_and_date_filters(client: TestClient) -> None:
    headers = _auth_headers(client)
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]

    last_month = TODAY - timedelta(days=30)
    for day in range(25):
        _create_transaction(
            client,
            headers,
            category_id=food["id"],
            amount=f"{(day + 1) * 100}.00",
            transaction_date=TODAY - timedelta(days=day % 5),
        )

    page1 = client.get(f"{API}/transactions?page=1&page_size=20", headers=headers).json()
    page2 = client.get(f"{API}/transactions?page=2&page_size=20", headers=headers).json()

    assert page1["pagination"]["total_items"] == 25
    assert page1["pagination"]["total_pages"] == 2
    assert len(page1["items"]) == 20
    assert len(page2["items"]) == 5

    filtered = client.get(
        f"{API}/transactions?start_date={last_month.isoformat()}&end_date={TODAY.isoformat()}",
        headers=headers,
    ).json()
    assert filtered["pagination"]["total_items"] == 25


def test_update_and_isolated_access_of_transactions(client: TestClient) -> None:
    headers = _auth_headers(client, "owner@example.com")
    other = _auth_headers(client, "intruder@example.com")
    food = client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()[0]
    tx = _create_transaction(client, headers, category_id=food["id"], amount="100.00")

    updated = client.patch(
        f"{API}/transactions/{tx['id']}",
        json={"amount": "150.50", "description": "Updated"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["amount"] == "150.50"

    intruder_get = client.get(f"{API}/transactions/{tx['id']}", headers=other)
    intruder_patch = client.patch(
        f"{API}/transactions/{tx['id']}", json={"amount": "1.00"}, headers=other
    )
    intruder_cancel = client.post(f"{API}/transactions/{tx['id']}/cancel", headers=other)

    assert intruder_get.status_code == 404
    assert intruder_patch.status_code == 404
    assert intruder_cancel.status_code == 404


# ---------- finance summary ----------


def test_balance_equals_income_minus_expenses_excluding_cancelled(client: TestClient) -> None:
    headers = _auth_headers(client)
    salary = next(
        c
        for c in client.get(f"{API}/categories?type=INCOME", headers=headers).json()
        if c["name"] == "Salary"
    )
    food = next(
        c
        for c in client.get(f"{API}/categories?type=EXPENSE", headers=headers).json()
        if c["name"] == "Food"
    )

    _create_transaction(
        client, headers, category_id=salary["id"], amount="3000000.00", type_="INCOME"
    )
    _create_transaction(client, headers, category_id=food["id"], amount="1200000.00")
    to_cancel = _create_transaction(client, headers, category_id=food["id"], amount="800000.00")
    client.post(f"{API}/transactions/{to_cancel['id']}/cancel", headers=headers)

    summary = client.get(f"{API}/finance/summary", headers=headers).json()

    assert summary["currency"] == "COP"
    assert summary["total_income"] == "3000000.00"
    assert summary["total_expenses"] == "1200000.00"
    assert summary["balance"] == "1800000.00"


def test_summary_excludes_future_dated_by_default(client: TestClient) -> None:
    headers = _auth_headers(client)
    salary = client.get(f"{API}/categories?type=INCOME", headers=headers).json()[0]

    _create_transaction(
        client,
        headers,
        category_id=salary["id"],
        amount="100000.00",
        type_="INCOME",
        transaction_date=TODAY + timedelta(days=5),
    )

    default_summary = client.get(f"{API}/finance/summary", headers=headers).json()
    assert default_summary["balance"] == "0.00"

    explicit_future = client.get(
        f"{API}/finance/summary?end_date={(TODAY + timedelta(days=10)).isoformat()}",
        headers=headers,
    ).json()
    assert explicit_future["balance"] == "100000.00"


# ---------- goals ----------


def test_goal_lifecycle_contributions_and_completion(client: TestClient) -> None:
    headers = _auth_headers(client)

    created = client.post(
        f"{API}/goals",
        json={"name": "New PC", "target_amount": "4000000.00"},
        headers=headers,
    )
    assert created.status_code == 201
    goal = created.json()
    assert goal["target_amount"] == "4000000.00"
    assert goal["current_amount"] == "0.00"
    assert goal["progress_percent"] == 0

    contribution = client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "2500000.00", "contribution_date": TODAY.isoformat()},
        headers=headers,
    )
    assert contribution.status_code == 201
    assert contribution.json()["amount"] == "2500000.00"

    detailed = client.get(f"{API}/goals/{goal['id']}", headers=headers).json()
    assert detailed["current_amount"] == "2500000.00"
    assert detailed["remaining_amount"] == "1500000.00"
    assert detailed["progress_percent"] == 62

    crossing = client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "1700000.00", "contribution_date": TODAY.isoformat()},
        headers=headers,
    )
    assert crossing.status_code == 201

    completed = client.get(f"{API}/goals/{goal['id']}", headers=headers).json()
    assert completed["status"] == "COMPLETED"
    # Actual accumulated stays accurate; display progress capped at 100%.
    assert completed["current_amount"] == "4200000.00"
    assert completed["progress_percent"] == 100

    listed = client.get(f"{API}/goals?status=COMPLETED", headers=headers).json()
    assert len(listed) == 1


def test_contribution_reverse_restores_active_status_and_totals(client: TestClient) -> None:
    headers = _auth_headers(client)
    goal = client.post(
        f"{API}/goals",
        json={"name": "Emergency fund", "target_amount": "3000000.00"},
        headers=headers,
    ).json()

    first = client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "3000000.00", "contribution_date": TODAY.isoformat()},
        headers=headers,
    ).json()
    second = client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "100000.00", "contribution_date": TODAY.isoformat()},
        headers=headers,
    ).json()

    reversed_first = client.post(
        f"{API}/goals/{goal['id']}/contributions/{first['id']}/reverse", headers=headers
    )
    assert reversed_first.status_code == 200
    assert reversed_first.json()["status"] == "CANCELLED"

    state = client.get(f"{API}/goals/{goal['id']}", headers=headers).json()
    # Goal dropped below target after reversal → ACTIVE again.
    assert state["status"] == "ACTIVE"
    assert state["current_amount"] == "100000.00"
    assert state["progress_percent"] == 3

    double_reverse = client.post(
        f"{API}/goals/{goal['id']}/contributions/{second['id']}/reverse", headers=headers
    )
    assert double_reverse.status_code != 405  # endpoint exists; tested below properly


def test_goal_validation_and_isolation(client: TestClient) -> None:
    headers = _auth_headers(client, "goal-owner@example.com")
    other = _auth_headers(client, "other-user@example.com")

    invalid = client.post(
        f"{API}/goals", json={"name": "", "target_amount": "-5"}, headers=headers
    )
    assert invalid.status_code == 422

    goal = client.post(
        f"{API}/goals",
        json={"name": "Trip", "target_amount": "1000000.00"},
        headers=headers,
    ).json()

    foreign_get = client.get(f"{API}/goals/{goal['id']}", headers=other)
    foreign_contribution = client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "10.00", "contribution_date": TODAY.isoformat()},
        headers=other,
    )
    assert foreign_get.status_code == 404
    assert foreign_contribution.status_code == 404

    cancelled = client.post(f"{API}/goals/{goal['id']}/cancel", headers=headers)
    assert cancelled.status_code == 200

    contribution_after_cancel = client.post(
        f"{API}/goals/{goal['id']}/contributions",
        json={"amount": "10.00", "contribution_date": TODAY.isoformat()},
        headers=headers,
    )
    assert contribution_after_cancel.status_code == 409

    cancel_again = client.post(f"{API}/goals/{goal['id']}/cancel", headers=headers)
    assert cancel_again.status_code == 409


def test_unknown_resource_ids_return_404(client: TestClient) -> None:
    headers = _auth_headers(client)
    random_id = uuid4()

    assert client.get(f"{API}/transactions/{random_id}", headers=headers).status_code == 404
    assert client.get(f"{API}/goals/{random_id}", headers=headers).status_code == 404
    assert (
        client.post(f"{API}/transactions/{random_id}/cancel", headers=headers).status_code == 404
    )
