"""Phase 7 — Payments API tests (ROADMAP §11, PAYMENT_RULES.md).

Expected values come from the official examples: §14–16 allocation,
§27 overpayment/credit, §44 reversal after subsequent payments.
Finance integration asserts no double counting."""

from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient

API = "/api/v1"
TODAY = date.today()


def _auth(client: TestClient, email: str) -> dict[str, str]:
    response = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secure-password-123", "full_name": "Lender"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _setup_loan(
    client: TestClient,
    headers: dict,
    *,
    principal="1000000.00",
    installments=10,
    interest_rate="10",
    first_due_offset_days=30,
    late_fee=None,
) -> dict:
    client_id = client.post(
        f"{API}/clients", json={"full_name": "Borrower"}, headers=headers
    ).json()["id"]

    start = TODAY - timedelta(days=first_due_offset_days + 1)
    payload = {
        "client_id": client_id,
        "principal": principal,
        "start_date": start.isoformat(),
        # Backdated so early installments are already due/overdue.
        "first_due_date": (start + timedelta(days=1)).isoformat(),
        "interest_rate": interest_rate,
        "interest_period": "MONTHLY",
        "amortization_type": "FIXED_PRINCIPAL",
        "payment_frequency": "MONTHLY",
        "number_of_installments": installments,
    }
    if late_fee:
        payload["late_fee_configuration"] = late_fee

    return client.post(f"{API}/loans", json=payload, headers=headers).json()


def _pay(client: TestClient, headers: dict, loan_id: str, amount: str, **extra):  # type: ignore[no-untyped-def]
    payload = {
        "amount": amount,
        "payment_date": TODAY.isoformat(),
        "payment_method": "CASH",
        **extra,
    }
    return client.post(f"{API}/loans/{loan_id}/payments", json=payload, headers=headers)


# ---------- full payment & loan completion ----------


def test_full_payment_marks_installment_and_loan_paid(client: TestClient) -> None:
    headers = _auth(client, "payer1@example.com")
    loan = _setup_loan(client, headers, principal="100000.00", installments=1)

    response = _pay(client, headers, loan["id"], "110000.00")
    assert response.status_code == 201, response.text
    body = response.json()

    assert body["allocation"]["late_fee"] == "0.00"
    assert body["allocation"]["interest"] == "10000.00"
    assert body["allocation"]["principal"] == "100000.00"
    assert body["allocation"]["credit"] == "0.00"

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    assert detail["status"] == "PAID"
    assert detail["total_outstanding"] == "0.00"

    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=headers).json()
    assert schedule["installments"][0]["status"] == "PAID"


# ---------- official partial examples ----------


def test_partial_payment_official_example_80000(client: TestClient) -> None:
    """PAYMENT_RULES §14/§62 with real accrued late fee: pay 80,000 against
    P 100,000 / I 20,000 / LF 5,000 → LF 5k, I 20k, P 55k."""
    headers = _auth(client, "payer2@example.com")
    loan = _setup_loan(
        client,
        headers,
        principal="100000.00",
        installments=1,
        interest_rate="20",  # official example: I = 20,000 on P = 100,000
        first_due_offset_days=10,
        late_fee={
            "enabled": True,
            "type": "FIXED_AMOUNT",
            "value": "5000.00",
            "grace_period_days": 2,
        },
    )

    body = _pay(client, headers, loan["id"], "80000.00").json()

    assert body["allocation"]["late_fee"] == "5000.00"
    assert body["allocation"]["interest"] == "20000.00"
    assert body["allocation"]["principal"] == "55000.00"

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    assert detail["status"] == "OVERDUE"  # balance remains on a past-due installment
    assert Decimal(detail["outstanding_principal"]) == Decimal("45000.00")


def test_payment_not_reaching_principal_keeps_it_intact(client: TestClient) -> None:
    """PAYMENT_RULES §15: pay 20,000 against LF 10,000 + I 20,000."""
    headers = _auth(client, "payer3@example.com")
    loan = _setup_loan(
        client,
        headers,
        principal="100000.00",
        installments=1,
        first_due_offset_days=10,
        late_fee={
            "enabled": True,
            "type": "FIXED_AMOUNT",
            "value": "10000.00",
            "grace_period_days": 0,
        },
    )

    body = _pay(client, headers, loan["id"], "20000.00").json()

    assert body["allocation"]["late_fee"] == "10000.00"
    assert body["allocation"]["interest"] == "10000.00"
    assert body["allocation"]["principal"] == "0.00"

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    assert Decimal(detail["outstanding_principal"]) == Decimal("100000.00")


# PART2_MARKER


def test_payment_spans_multiple_installments_oldest_first(client: TestClient) -> None:
    """PAYMENT_RULES §23-24/SS60: one payment covers installment 1 fully
    and part of installment 2."""
    headers = _auth(client, "payer4@example.com")
    loan = _setup_loan(
        client,
        headers,
        principal="100000.00",
        installments=2,
        first_due_offset_days=40,
    )

    # inst1 opens at 100k -> I 10k + P 50k = 60k; inst2 opens at 50k -> I 5k.
    # Paying 80k settles inst1 fully and puts 15k into inst2 principal.
    body = _pay(client, headers, loan["id"], "80000.00").json()

    assert body["allocation"]["principal"] == "65000.00"
    assert body["allocation"]["interest"] == "15000.00"

    schedule = client.get(f"{API}/loans/{loan['id']}/schedule", headers=headers).json()
    statuses = [i["status"] for i in schedule["installments"]]
    assert statuses[0] == "PAID"
    assert statuses[1] in ("PARTIAL", "OVERDUE", "PENDING")


# ---------- overpayment / credit ----------


def test_overpayment_becomes_explicit_credit_and_loan_paid(client: TestClient) -> None:
    """PAYMENT_RULES SS27: outstanding 110000; pay 160000 -> credit 50000."""
    headers = _auth(client, "payer5@example.com")
    loan = _setup_loan(client, headers, principal="100000.00", installments=1)

    body = _pay(client, headers, loan["id"], "160000.00").json()

    assert body["allocation"]["credit"] == "50000.00"

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    assert detail["status"] == "PAID"


# ---------- state guards ----------


def test_payment_against_fully_paid_loan_rejected(client: TestClient) -> None:
    headers = _auth(client, "payer6@example.com")
    loan = _setup_loan(client, headers, principal="100000.00", installments=1)
    _pay(client, headers, loan["id"], "110000.00")

    second = _pay(client, headers, loan["id"], "1000.00")

    assert second.status_code == 409
    assert second.json()["error"]["code"] == "LOAN_ALREADY_PAID"


def test_payment_against_cancelled_loan_rejected(client: TestClient) -> None:
    headers = _auth(client, "payer7@example.com")
    loan = _setup_loan(client, headers, principal="100000.00", installments=2)
    client.post(f"{API}/loans/{loan['id']}/cancel", headers=headers)

    response = _pay(client, headers, loan["id"], "1000.00")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "LOAN_CANCELLED"


def test_zero_amount_rejected(client: TestClient) -> None:
    headers = _auth(client, "payer8@example.com")
    loan = _setup_loan(client, headers, principal="100000.00", installments=1)

    response = _pay(client, headers, loan["id"], "0.00")

    assert response.status_code == 422


# ---------- idempotency ----------


def test_same_idempotency_key_does_not_duplicate_payment(client: TestClient) -> None:
    headers = _auth(client, "idem@example.com")
    loan = _setup_loan(client, headers, principal="200000.00", installments=2)

    key = "payment-op-001"
    first = _pay(client, headers, loan["id"], "60000.00", headers_extra=None) if False else client.post(
        f"{API}/loans/{loan['id']}/payments",
        json={"amount": "60000.00", "payment_date": TODAY.isoformat(), "payment_method": "CASH"},
        headers={**headers, "Idempotency-Key": key},
    )
    replay = client.post(
        f"{API}/loans/{loan['id']}/payments",
        json={"amount": "60000.00", "payment_date": TODAY.isoformat(), "payment_method": "CASH"},
        headers={**headers, "Idempotency-Key": key},
    )

    assert first.status_code == 201
    assert replay.status_code == 201
    assert replay.json()["id"] == first.json()["id"]

    history = client.get(f"{API}/loans/{loan['id']}/payments", headers=headers).json()
    assert history["pagination"]["total_items"] == 1

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    # inst1 opens at 200k -> I 20k; P allocated = 60k - 20k = 40k.
    assert Decimal(detail["outstanding_principal"]) == Decimal("160000.00")


# PART3_MARKER


# ---------- reversal (PAYMENT_RULES SS41-45, SS44) ----------


def test_reversal_restores_balances_and_cancels_income(client: TestClient) -> None:
    headers = _auth(client, "reverser@example.com")
    loan = _setup_loan(
        client,
        headers,
        principal="100000.00",
        installments=1,
    )

    payment = _pay(client, headers, loan["id"], "110000.00").json()
    assert client.get(f"{API}/loans/{loan['id']}", headers=headers).json()["status"] == "PAID"

    # Income was posted for the interest portion only.
    summary_before = client.get(f"{API}/finance/summary", headers=headers).json()
    assert Decimal(summary_before["total_income"]) == Decimal("10000.00")

    reversal = client.post(
        f"{API}/loans/{loan['id']}/payments/{payment['id']}/reverse",
        json={"reason": "Wrong amount entered"},
        headers=headers,
    )
    assert reversal.status_code == 200
    assert reversal.json()["status"] == "REVERSED"

    detail = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    assert detail["status"] in ("ACTIVE", "OVERDUE")
    assert Decimal(detail["outstanding_principal"]) == Decimal("100000.00")

    # Linked income transaction is cancelled, not deleted.
    summary_after = client.get(f"{API}/finance/summary", headers=headers).json()
    assert Decimal(summary_after["total_income"]) == Decimal("0.00")

    again = client.post(
        f"{API}/loans/{loan['id']}/payments/{payment['id']}/reverse",
        json={"reason": "double"},
        headers=headers,
    )
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "PAYMENT_ALREADY_REVERSED"


def test_reversal_after_subsequent_payment_stays_consistent(client: TestClient) -> None:
    """SS44: A then B then reverse A -> B's effects remain untouched and
    totals reconcile from stored allocations."""
    headers = _auth(client, "sequence@example.com")
    loan = _setup_loan(client, headers, principal="200000.00", installments=2)

    payment_a = _pay(client, headers, loan["id"], "60000.00").json()   # inst1 fully
    _pay(client, headers, loan["id"], "60000.00")                      # inst2 partial

    detail_before = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()
    principal_after_ab = Decimal(detail_before["outstanding_principal"])

    reversed_a = client.post(
        f"{API}/loans/{loan['id']}/payments/{payment_a['id']}/reverse",
        json={"reason": "customer bounced"},
        headers=headers,
    )
    assert reversed_a.status_code == 200

    detail_after = client.get(f"{API}/loans/{loan['id']}", headers=headers).json()

    # Only A's principal component (40k) is restored; B stays applied.
    assert Decimal(detail_after["outstanding_principal"]) == principal_after_ab + Decimal("40000.00")
    assert Decimal(detail_after["outstanding_principal"]) == Decimal("140000.00")


# ---------- finance integration (no double counting) ----------


def test_income_records_interest_and_late_fees_only_never_principal(client: TestClient) -> None:
    """FINANCIAL_RULES SS25-31 / PAYMENT_RULES SS53-57: income = I + LF."""
    headers = _auth(client, "integrator@example.com")
    loan = _setup_loan(
        client,
        headers,
        principal="100000.00",
        installments=1,
        interest_rate="20",  # official SS53 example numbers
        first_due_offset_days=10,
        late_fee={
            "enabled": True,
            "type": "FIXED_AMOUNT",
            "value": "5000.00",
            "grace_period_days": 0,
        },
    )

    body = _pay(client, headers, loan["id"], "125000.00").json()
    assert body["allocation"]["principal"] == "100000.00"
    assert body["allocation"]["interest"] == "20000.00"
    assert body["allocation"]["late_fee"] == "5000.00"

    summary = client.get(f"{API}/finance/summary", headers=headers).json()
    # 20k interest + 5k late fee = 25k income; the 100k principal NEVER counts.
    assert Decimal(summary["total_income"]) == Decimal("25000.00")


# ---------- isolation ----------


def test_user_cannot_pay_or_reverse_another_users_loan_payments(client: TestClient) -> None:
    owner = _auth(client, "p-owner@example.com")
    intruder = _auth(client, "p-intruder@example.com")

    loan = _setup_loan(client, owner, principal="100000.00", installments=1)
    payment = _pay(client, owner, loan["id"], "110000.00").json()

    pay = client.post(
        f"{API}/loans/{loan['id']}/payments",
        json={"amount": "10.00", "payment_date": TODAY.isoformat(), "payment_method": "CASH"},
        headers=intruder,
    )
    reverse = client.post(
        f"{API}/loans/{loan['id']}/payments/{payment['id']}/reverse",
        json={"reason": "intruder"},
        headers=intruder,
    )
    history = client.get(f"{API}/loans/{loan['id']}/payments", headers=intruder)

    assert pay.status_code == 404
    assert reverse.status_code == 404
    assert history.status_code == 404
