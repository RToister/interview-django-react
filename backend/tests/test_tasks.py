from datetime import timedelta

import pytest
from django.utils import timezone

from tasks.models import Task

pytestmark = pytest.mark.django_db


def make_task(owner, **kwargs):
    defaults = {"title": "Task"}
    defaults.update(kwargs)
    return Task.objects.create(owner=owner, **defaults)


def test_tasks_require_auth(api_client):
    assert api_client.get("/api/tasks/").status_code == 401


def test_create_task(auth_client, user):
    response = auth_client.post(
        "/api/tasks/",
        {"title": "  Write tests  ", "priority": "high"},
        format="json",
    )

    assert response.status_code == 201
    assert response.data["title"] == "Write tests"
    assert response.data["status"] == "todo"
    assert Task.objects.get().owner == user


def test_create_task_rejects_blank_title(auth_client):
    response = auth_client.post("/api/tasks/", {"title": "   "}, format="json")

    assert response.status_code == 400
    assert "title" in response.data


def test_list_only_own_tasks(auth_client, user, other_user):
    make_task(user, title="Mine")
    make_task(other_user, title="Not mine")

    response = auth_client.get("/api/tasks/")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["title"] == "Mine"


def test_cannot_access_foreign_task(auth_client, other_user):
    task = make_task(other_user)

    assert auth_client.get(f"/api/tasks/{task.pk}/").status_code == 404
    assert auth_client.delete(f"/api/tasks/{task.pk}/").status_code == 404


def test_update_and_delete(auth_client, user):
    task = make_task(user)

    response = auth_client.patch(f"/api/tasks/{task.pk}/", {"status": "done"}, format="json")
    assert response.status_code == 200
    assert response.data["status"] == "done"

    assert auth_client.delete(f"/api/tasks/{task.pk}/").status_code == 204
    assert not Task.objects.exists()


def test_filter_search_and_order(auth_client, user):
    make_task(user, title="Buy milk", priority="low")
    make_task(user, title="Fix bug", priority="high", status="in_progress")
    make_task(user, title="Review PR", priority="medium")

    by_status = auth_client.get("/api/tasks/", {"status": "in_progress"})
    assert [t["title"] for t in by_status.data["results"]] == ["Fix bug"]

    by_search = auth_client.get("/api/tasks/", {"search": "milk"})
    assert [t["title"] for t in by_search.data["results"]] == ["Buy milk"]

    by_priority = auth_client.get("/api/tasks/", {"ordering": "-priority"})
    assert [t["priority"] for t in by_priority.data["results"]] == ["high", "medium", "low"]


def test_pagination(auth_client, user):
    for index in range(12):
        make_task(user, title=f"Task {index}")

    response = auth_client.get("/api/tasks/", {"page": 2})

    assert response.data["count"] == 12
    assert len(response.data["results"]) == 2


def test_stats_and_overdue(auth_client, user):
    yesterday = timezone.localdate() - timedelta(days=1)
    make_task(user, status="todo", due_date=yesterday)
    make_task(user, status="in_progress")
    make_task(user, status="done", due_date=yesterday)

    stats = auth_client.get("/api/tasks/stats/").data
    assert stats == {"total": 3, "todo": 1, "in_progress": 1, "done": 1, "overdue": 1}

    listing = auth_client.get("/api/tasks/", {"status": "todo"}).data
    assert listing["results"][0]["is_overdue"] is True
