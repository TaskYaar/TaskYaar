from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GoogleLoginView,
    GoogleRegisterView,
    RegisterView,
    SendOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("send-otp/", SendOTPView.as_view()),
    path("verify-otp/", VerifyOTPView.as_view()),
    path("register/", RegisterView.as_view()),
    path("google/", GoogleLoginView.as_view()),
    path("google-register/", GoogleRegisterView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
]