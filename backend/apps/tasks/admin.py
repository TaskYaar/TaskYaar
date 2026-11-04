from django.contrib import admin

from .models import Category, Task


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "category", "budget", "city", "status", "created_at")
    list_filter = ("status", "category", "city")
    search_fields = ("title", "description", "owner__email")
    raw_id_fields = ("owner",)