from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from . import services
from .serializers import (
    LogoutSerializer,
    SendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)


class AuthThrottleMixin:
    """Per-client rate limit for auth endpoints (rate "auth" in settings)."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"
    permission_classes = [AllowAny]
    authentication_classes = []


class SendOTPView(AuthThrottleMixin, APIView):
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.send_otp(phone=serializer.validated_data["phone"])
        return Response({"ok": True, "expires_in": int(services.OTP_TTL.total_seconds())})


class VerifyOTPView(AuthThrottleMixin, APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.verify_otp(
            phone=serializer.validated_data["phone"], code=serializer.validated_data["otp"]
        )
        is_new = not user.is_profile_complete
        return Response(
            {
                **services.issue_tokens(user),
                # New users have no profile yet: the app sends them to the profile page.
                "user": None if is_new else UserSerializer(user).data,
                "is_new": is_new,
            }
        )


class RefreshView(AuthThrottleMixin, TokenRefreshView):
    pass


class LogoutView(AuthThrottleMixin, APIView):
    """Blacklists the refresh token so it can never be used again."""

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user