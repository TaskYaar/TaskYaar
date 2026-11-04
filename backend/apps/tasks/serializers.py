from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Category, Task

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class TaskOwnerSerializer(serializers.ModelSerializer):
    """Public view of the poster. Never expose email or phone here."""

    class Meta:
        model = User
        fields = ["id", "full_name"]


class TaskSerializer(serializers.ModelSerializer):
    owner = TaskOwnerSerializer(read_only=True)
    category = serializers.SlugRelatedField(
        slug_field="slug", queryset=Category.objects.filter(is_active=True)
    )
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "owner",
            "category",
            "category_name",
            "title",
            "description",
            "budget",
            "city",
            "area",
            "scheduled_for",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "status", "created_at", "updated_at"]

    def validate_scheduled_for(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Scheduled time must be in the future.")
        return value