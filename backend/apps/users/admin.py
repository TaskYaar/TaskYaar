from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .forms import UserChangeForm, UserCreationForm
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    ordering = ("-created_at",)
    list_display = ("email", "full_name", "role", "is_active", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "full_name", "phone")
    readonly_fields = ("last_login", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "phone", "role")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )