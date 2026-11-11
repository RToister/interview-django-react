import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user(username="alice", password="S3cure-pass!")


@pytest.fixture
def other_user(db):
    return get_user_model().objects.create_user(username="bob", password="S3cure-pass!")


@pytest.fixture
def auth_client(api_client, user):
    response = api_client.post(
        "/api/auth/token/", {"username": "alice", "password": "S3cure-pass!"}
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access_token']}")
    return api_client
