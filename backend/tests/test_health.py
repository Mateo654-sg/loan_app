from fastapi.testclient import TestClient

from app.core.config import get_settings


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get(f"{get_settings().api_v1_prefix}/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_unknown_route_returns_404_error_shape(client: TestClient) -> None:
    response = client.get(f"{get_settings().api_v1_prefix}/does-not-exist")

    assert response.status_code == 404


def test_openapi_docs_available_in_development(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
