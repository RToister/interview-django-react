import django_filters
from django.db.models import Case, IntegerField, Value, When

from .models import Task

PRIORITY_RANK = Case(
    When(priority=Task.Priority.LOW, then=Value(1)),
    When(priority=Task.Priority.MEDIUM, then=Value(2)),
    When(priority=Task.Priority.HIGH, then=Value(3)),
    output_field=IntegerField(),
)


class TaskFilter(django_filters.FilterSet):
    ordering = django_filters.OrderingFilter(
        fields=(
            ("created_at", "created_at"),
            ("due_date", "due_date"),
            ("priority_rank", "priority"),
            ("title", "title"),
        ),
    )

    class Meta:
        model = Task
        fields = ("status", "priority")
