import jwt as pyjwt
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import create_token

API = "/api/v1"


def _register_payload(email: str = "user@example.com", password: str | None = None) -> dict:
    return {
        "email": email,
        "password": password or "secure-password-123",
        "full_name": "John Doe",
    }


def test_register_creates_user_and_returns_tokens(client: TestClient) -> None:
    response = client.post(f"{API}/auth/register", json=_register_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "user@example.com"
    assert body["user"]["full_name"] == "John Doe"
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_register_normalizes_email_to_lowercase(client: TestClient) -> None:
    response = client.post(
        f"{API}/auth/register", json=_register_payload(email="Mixed.Case@Example.COM")
    )

    assert response.status_code == 201
    assert response.json()["user"]["email"] == "mixed.case@example.com"


def test_register_rejects_duplicate_email_regardless_of_case(client: TestClient) -> None:
    first = client.post(f"{API}/auth/register", json=_register_payload(email="dup@example.com"))
    second = client.post(f"{API}/auth/register", json=_register_payload(email="DUP@example.com"))

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


def test_register_rejects_invalid_email(client: TestClient) -> None:
    response = client.post(f"{API}/auth/register", json=_register_payload(email="not-an-email"))

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"


def test_register_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        f"{API}/auth/register", json=_register_payload(password="short")
    )

    assert response.status_code == 422


def test_login_with_valid_credentials_returns_tokens(client: TestClient) -> None:
    client.post(f"{API}/auth/register", json=_register_payload())
    response = client.post(
        f"{API}/auth/login",
        json={"email": "user@example.com", "password": "secure-password-123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]


def test_login_fails_identically_for_unknown_email_and_wrong_password(client: TestClient) -> None:
    client.post(f"{API}/auth/register", json=_register_payload())

    unknown_email = client.post(
        f"{API}/auth/login",
        json={"email": "ghost@example.com", "password": "whatever-value-1"},
    )
    wrong_password = client.post(
        f"{API}/auth/login",
        json={"email": "user@example.com", "password": "wrong-password-1"},
    )

    assert unknown_email.status_code == wrong_password.status_code == 401
    assert unknown_email.json() == wrong_password.json()
    assert unknown_email.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_me_requires_authentication(client: TestClient) -> None:
    no_token = client.get(f"{API}/auth/me")
    invalid_token = client.get(
        f"{API}/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )

    assert no_token.status_code == 401
    assert invalid_token.status_code == 401
    assert no_token.json()["error"]["code"] == "NOT_AUTHENTICATED"
    assert invalid_token.json()["error"]["code"] == "INVALID_TOKEN"


def test_me_rejects_expired_access_token(client: TestClient) -> None:
    settings = get_settings()
    expired = pyjwt.encode(
        {
            "sub": "00000000-0000-0000-0000-000000000001",
            "type": "access",
            "iat": 0,
            "exp": 0,
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    response = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {expired}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_me_rejects_refresh_token_used_as_access_token(client: TestClient) -> None:
    register = client.post(f"{API}/auth/register", json=_register_payload())
    refresh_token = register.json()["refresh_token"]

    response = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {refresh_token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_me_returns_authenticated_user(client: TestClient) -> None:
    register = client.post(f"{API}/auth/register", json=_register_payload())
    access_token = register.json()["access_token"]

    response = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_refresh_returns_new_access_token(client: TestClient) -> None:
    register = client.post(f"{API}/auth/register", json=_register_payload())
    refresh_token = register.json()["refresh_token"]

    response = client.post(f"{API}/auth/refresh", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert response.json()["access_token"]

    new_access = response.json()["access_token"]
    me_response = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {new_access}"})
    assert me_response.status_code == 200


def test_refresh_rejects_access_token_as_refresh_token(client: TestClient) -> None:
    register = client.post(f"{API}/auth/register", json=_register_payload())
    access_token = register.json()["access_token"]

    response = client.post(f"{API}/auth/refresh", json={"refresh_token": access_token})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


def test_refresh_rejects_garbage_token(client: TestClient) -> None:
    response = client.post(f"{API}/auth/refresh", json={"refresh_token": "garbage"})

    assert response.status_code == 401


def test_logout_returns_204_without_body(client: TestClient) -> None:
    response = client.post(f"{API}/auth/logout")

    assert response.status_code == 204


def test_password_is_stored_hashed_not_plaintext(client: TestClient, settings) -> None:  # type: ignore[no-untyped-def]
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.user import User

    client.post(f"{API}/auth/register", json=_register_payload(password="plaintext-check-123"))

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "user@example.com"))

    assert user is not None
    assert user.password_hash != "plaintext-check-123"
    assert user.password_hash.startswith("$argon2id$")
