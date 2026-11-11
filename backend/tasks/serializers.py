from django.utils import timezone
from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "is_overdue",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_overdue", "created_at", "updated_at")

    def get_is_overdue(self, task: Task) -> bool:
        return bool(
            task.due_date
            and task.status != Task.Status.DONE
            and task.due_date < timezone.localdate()
        )

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title must not be blank.")
        return value


class TaskStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    todo = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    done = serializers.IntegerField()
    overdue = serializers.IntegerField()
