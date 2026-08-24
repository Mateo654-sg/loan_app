"""Phase 4 — Customers API tests (ROADMAP §8).

Covers client CRUD with search/pagination, deactivation, references
lifecycle, financial summary skeleton and strict user isolation.
"""

from uuid import uuid4

from fastapi.testclient import TestClient

API = "/api/v1"

CLIENT_A = {
    "full_name": "Juan Pérez",
    "document_number": "123456789",
    "phone": "3001234567",
    "email": "juan@example.com",
    "address": "Medellín",
}

REFERENCE = {
    "name": "María Pérez",
    "phone": "3011234567",
    "address": "Medellín",
    "relationship": "Sister",
}


def _auth_headers(client: TestClient, email: str) -> dict[str, str]:
    response = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secure-password-123", "full_name": "Owner"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_client(client: TestClient, headers: dict, **overrides) -> dict:
    payload = {**CLIENT_A, **overrides}
    response = client.post(f"{API}/clients", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------- creation & validation ----------


def test_create_client_returns_full_profile(client: TestClient) -> None:
    headers = _auth_headers(client, "owner1@example.com")

    created = _create_client(client, headers)

    assert created["full_name"] == "Juan Pérez"
    assert created["status"] == "ACTIVE"
    assert created["email"] == "juan@example.com"


def test_create_client_normalizes_email_and_allows_empty_fields(client: TestClient) -> None:
    headers = _auth_headers(client, "owner2@example.com")

    minimal = client.post(f"{API}/clients", json={"full_name": "Solo Name"}, headers=headers)
    assert minimal.status_code == 201

    mixed = client.post(
        f"{API}/clients",
        json={"full_name": "Mixed", "email": "MiXeD@ExAmple.COM"},
        headers=headers,
    )
    assert mixed.status_code == 201
    assert mixed.json()["email"] == "mixed@example.com"


def test_create_client_rejects_invalid_email_and_blank_name(client: TestClient) -> None:
    headers = _auth_headers(client, "owner3@example.com")

    bad_email = client.post(
        f"{API}/clients", json={"full_name": "X", "email": "not-an-email"}, headers=headers
    )
    blank_name = client.post(f"{API}/clients", json={"full_name": ""}, headers=headers)

    assert bad_email.status_code == 422
    assert blank_name.status_code == 422


# ---------- listing, search, pagination ----------


def test_list_clients_searches_by_name_document_and_phone(client: TestClient) -> None:
    headers = _auth_headers(client, "searcher@example.com")
    _create_client(client, headers, full_name="Ana Torres", document_number="555")
    _create_client(client, headers, full_name="Carlos Ruiz", phone="3119998877")
    _create_client(client, headers, full_name="Beatriz Mejía")

    by_name = client.get(f"{API}/clients?search=ana", headers=headers).json()
    by_document = client.get(f"{API}/clients?search=555", headers=headers).json()
    by_phone = client.get(f"{API}/clients?search=3119", headers=headers).json()
    no_match = client.get(f"{API}/clients?search=zorro", headers=headers).json()

    assert [c["full_name"] for c in by_name["items"]] == ["Ana Torres"]
    assert [c["full_name"] for c in by_document["items"]] == ["Ana Torres"]
    assert [c["full_name"] for c in by_phone["items"]] == ["Carlos Ruiz"]
    assert no_match["pagination"]["total_items"] == 0


def test_list_clients_is_paginated_and_status_filterable(client: TestClient) -> None:
    headers = _auth_headers(client, "pager@example.com")
    for index in range(25):
        _create_client(client, headers, full_name=f"Cliente {index:02d}")

    page1 = client.get(f"{API}/clients?page=1&page_size=20", headers=headers).json()
    page2 = client.get(f"{API}/clients?page=2&page_size=20", headers=headers).json()

    assert page1["pagination"]["total_items"] == 25
    assert len(page1["items"]) == 20
    assert len(page2["items"]) == 5

    target_id = page2["items"][0]["id"]
    client.post(f"{API}/clients/{target_id}/deactivate", headers=headers)

    active_only = client.get(f"{API}/clients?status=ACTIVE", headers=headers).json()
    inactive_only = client.get(f"{API}/clients?status=INACTIVE", headers=headers).json()

    assert active_only["pagination"]["total_items"] == 24
    assert inactive_only["pagination"]["total_items"] == 1


# ---------- update & deactivation ----------


def test_update_client_partial_fields(client: TestClient) -> None:
    headers = _auth_headers(client, "updater@example.com")
    created = _create_client(client, headers)

    updated = client.patch(
        f"{API}/clients/{created['id']}",
        json={"phone": "3110000000", "address": "Bogotá"},
        headers=headers,
    )

    assert updated.status_code == 200
    assert updated.json()["phone"] == "3110000000"
    assert updated.json()["address"] == "Bogotá"
    assert updated.json()["full_name"] == "Juan Pérez"  # untouched


def test_deactivate_client_twice_conflicts(client: TestClient) -> None:
    headers = _auth_headers(client, "deactivator@example.com")
    created = _create_client(client, headers)

    first = client.post(f"{API}/clients/{created['id']}/deactivate", headers=headers)
    second = client.post(f"{API}/clients/{created['id']}/deactivate", headers=headers)

    assert first.status_code == 200
    assert first.json()["status"] == "INACTIVE"
    assert second.status_code == 409


# ---------- summary ----------


def test_client_summary_returns_contract_with_zero_loan_metrics(client: TestClient) -> None:
    headers = _auth_headers(client, "summarizer@example.com")
    created = _create_client(client, headers)

    summary = client.get(f"{API}/clients/{created['id']}/summary", headers=headers).json()

    assert summary["client_id"] == created["id"]
    # Loan domain does not exist yet (Phase 6+); contract fields stay zero.
    assert summary["active_loans"] == 0
    assert summary["total_capital_lent"] == "0.00"
    assert summary["outstanding_capital"] == "0.00"
    assert summary["total_receivable"] == "0.00"
    assert summary["total_overdue"] == "0.00"


# ---------- references ----------


def test_reference_lifecycle(client: TestClient) -> None:
    headers = _auth_headers(client, "ref-owner@example.com")
    created = _create_client(client, headers)

    added = client.post(
        f"{API}/clients/{created['id']}/references", json=REFERENCE, headers=headers
    )
    assert added.status_code == 201
    reference = added.json()
    assert reference["is_active"] is True

    listed = client.get(f"{API}/clients/{created['id']}/references", headers=headers).json()
    assert len(listed) == 1

    renamed = client.patch(
        f"{API}/clients/{created['id']}/references/{reference['id']}",
        json={"relationship": "Cousin"},
        headers=headers,
    )
    assert renamed.status_code == 200
    assert renamed.json()["relationship"] == "Cousin"
    assert renamed.json()["name"] == "María Pérez"  # untouched

    deactivated = client.post(
        f"{API}/clients/{created['id']}/references/{reference['id']}/deactivate",
        headers=headers,
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    again = client.post(
        f"{API}/clients/{created['id']}/references/{reference['id']}/deactivate",
        headers=headers,
    )
    assert again.status_code == 409


# ---------- isolation ----------


def test_user_cannot_access_another_users_clients_or_references(client: TestClient) -> None:
    owner = _auth_headers(client, "iso-owner@example.com")
    intruder = _auth_headers(client, "iso-intruder@example.com")

    foreign = _create_client(client, owner)
    client.post(
        f"{API}/clients/{foreign['id']}/references", json=REFERENCE, headers=owner
    )
    foreign_refs = client.get(f"{API}/clients/{foreign['id']}/references", headers=owner).json()

    get = client.get(f"{API}/clients/{foreign['id']}", headers=intruder)
    patch = client.patch(
        f"{API}/clients/{foreign['id']}", json={"full_name": "Hacked"}, headers=intruder
    )
    deactivate = client.post(f"{API}/clients/{foreign['id']}/deactivate", headers=intruder)
    summary = client.get(f"{API}/clients/{foreign['id']}/summary", headers=intruder)
    refs = client.get(f"{API}/clients/{foreign['id']}/references", headers=intruder)
    add_ref = client.post(
        f"{API}/clients/{foreign['id']}/references", json=REFERENCE, headers=intruder
    )
    patch_ref = client.patch(
        f"{API}/clients/{foreign['id']}/references/{foreign_refs[0]['id']}",
        json={"name": "Hacked"},
        headers=intruder,
    )
    deactivate_ref = client.post(
        f"{API}/clients/{foreign['id']}/references/{foreign_refs[0]['id']}/deactivate",
        headers=intruder,
    )

    assert get.status_code == 404
    assert patch.status_code == 404
    assert deactivate.status_code == 404
    assert summary.status_code == 404
    assert refs.status_code == 404
    assert add_ref.status_code == 404
    assert patch_ref.status_code == 404
    assert deactivate_ref.status_code == 404

    # Intruder's own list stays empty.
    own = client.get(f"{API}/clients", headers=intruder).json()
    assert own["pagination"]["total_items"] == 0


def test_unknown_client_id_returns_404(client: TestClient) -> None:
    headers = _auth_headers(client, "unknowns@example.com")

    assert client.get(f"{API}/clients/{uuid4()}", headers=headers).status_code == 404
    assert (
        client.get(f"{API}/clients/{uuid4()}/summary", headers=headers).status_code == 404
    )
