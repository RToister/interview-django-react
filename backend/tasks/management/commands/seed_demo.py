from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from tasks.models import Task

DEMO_TASKS = [
    ("Set up CI pipeline", "Run tests and linters on every push.", "done", "high", -3),
    ("Design database schema", "Users, tasks, statuses and priorities.", "done", "medium", -5),
    ("Implement JWT auth", "Register, obtain token, current user.", "in_progress", "high", 1),
    ("Write API tests", "Cover permissions, filters and pagination.", "in_progress", "medium", 2),
    ("Add task filters", "Status, priority, search and ordering.", "todo", "medium", 4),
    ("Prepare demo", "Seed data and record a short walkthrough.", "todo", "low", 7),
    ("Update README", "Document setup, architecture and API.", "todo", "low", -1),
]


class Command(BaseCommand):
    help = "Create a demo user (demo / demo-pass-123) with sample tasks."

    def handle(self, *args, **options):
        user, created = get_user_model().objects.get_or_create(username="demo")
        if created:
            user.set_password("demo-pass-123")
            user.save()

        user.tasks.all().delete()
        today = timezone.localdate()
        Task.objects.bulk_create(
            Task(
                owner=user,
                title=title,
                description=description,
                status=status,
                priority=priority,
                due_date=today + timedelta(days=days),
            )
            for title, description, status, priority, days in DEMO_TASKS
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo user 'demo' / 'demo-pass-123' with {len(DEMO_TASKS)} tasks is ready."
            )
        )
