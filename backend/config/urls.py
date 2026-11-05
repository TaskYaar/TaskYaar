from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/", include("apps.otp_auth.urls")),   # <-- add this
    path("api/", include("apps.tasks.urls")),
    path("api/", include("apps.users.urls")),
]