from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import PRIORITY_RANK, TaskFilter
from .models import Task
from .serializers import TaskSerializer, TaskStatsSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for the current user's tasks.

    Supports ``?status=``, ``?priority=``, ``?search=`` (title/description),
    ``?ordering=`` (``created_at``, ``due_date``, ``priority``, ``title``,
    prefix with ``-`` for descending) and ``?page=``.
    """

    serializer_class = TaskSerializer
    filterset_class = TaskFilter
    search_fields = ("title", "description")
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Task.objects.none()
        return Task.objects.filter(owner=self.request.user).annotate(priority_rank=PRIORITY_RANK)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @extend_schema(responses=TaskStatsSerializer)
    @action(detail=False)
    def stats(self, request):
        today = timezone.localdate()
        stats = Task.objects.filter(owner=request.user).aggregate(
            total=Count("id"),
            todo=Count("id", filter=Q(status=Task.Status.TODO)),
            in_progress=Count("id", filter=Q(status=Task.Status.IN_PROGRESS)),
            done=Count("id", filter=Q(status=Task.Status.DONE)),
            overdue=Count(
                "id",
                filter=Q(due_date__lt=today) & ~Q(status=Task.Status.DONE),
            ),
        )
        return Response(stats)
