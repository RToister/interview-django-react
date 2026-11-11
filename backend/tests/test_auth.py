import pytest

pytestmark = pytest.mark.django_db


def test_register_creates_user(api_client):
    response = api_client.post(
        "/api/auth/register/",
        {"username": "carol", "email": "carol@example.com", "password": "S3cure-pass!"},
    )

    assert response.status_code == 201
    assert response.data["username"] == "carol"
    assert "password" not in response.data


def test_register_rejects_weak_password(api_client):
    response = api_client.post("/api/auth/register/", {"username": "dave", "password": "123"})

    assert response.status_code == 400
    assert "password" in response.data or "non_field_errors" in response.data


def test_token_with_valid_credentials(api_client, user):
    response = api_client.post(
        "/api/auth/token/", {"username": "alice", "password": "S3cure-pass!"}
    )

    assert response.status_code == 200
    assert response.data["token_type"] == "bearer"
    assert response.data["access_token"]


def test_token_with_wrong_password(api_client, user):
    response = api_client.post("/api/auth/token/", {"username": "alice", "password": "nope"})

    assert response.status_code == 401


def test_me_requires_auth(api_client):
    assert api_client.get("/api/auth/me/").status_code == 401


def test_me_returns_current_user(auth_client):
    response = auth_client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["username"] == "alice"


def test_health(api_client):
    assert api_client.get("/api/health/").json() == {"status": "ok"}
