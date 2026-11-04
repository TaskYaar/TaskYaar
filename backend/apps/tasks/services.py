from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Task


@transaction.atomic
def update_task(*, task, validated_data):
    """Edit a task. Only open tasks can be edited."""
    task = Task.objects.select_for_update().get(pk=task.pk)
    if task.status != Task.Status.OPEN:
        raise ValidationError("Only open tasks can be edited.")
    for field, value in validated_data.items():
        setattr(task, field, value)
    task.save()
    return task


@transaction.atomic
def cancel_task(*, task):
    """Cancel a task. Only open tasks can be cancelled."""
    task = Task.objects.select_for_update().get(pk=task.pk)
    if task.status != Task.Status.OPEN:
        raise ValidationError("Only open tasks can be cancelled.")
    task.status = Task.Status.CANCELLED
    task.save(update_fields=["status", "updated_at"])
    return task