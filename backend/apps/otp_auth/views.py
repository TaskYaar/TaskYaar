from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from . import google, services
from .serializers import (
    GoogleRegisterSerializer,
    GoogleSerializer,
    PhoneSerializer,
    RegisterSerializer,
    VerifySerializer,
)


class SendOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        s = PhoneSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            services.send_otp(s.validated_data["phone"])
        except services.OTPError as e:
            return Response({"detail": e.message}, status=e.status)
        return Response({"detail": "Code sent."})


class VerifyOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        s = VerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        phone, code = s.validated_data["phone"], s.validated_data["otp"]

        try:
            services.verify_otp(phone, code)
        except services.OTPError as e:
            return Response({"detail": e.message}, status=e.status)

        user, _ = services.get_or_create_user(phone)
        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=403)

        payload = services.user_payload(user)
        return Response(
            {**services.issue_tokens(user), "is_new": payload is None, "user": payload}
        )


class RegisterView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        user = services.update_profile(
            request.user,
            name=d["name"].strip(),
            email=d.get("email", ""),
            city=d.get("city", "").strip(),
            role=d["role"],
        )
        return Response({"user": services.user_payload(user)})


class GoogleLoginView(APIView):
    """Existing Google user: log in. New Google user: return a short-lived signup token."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        s = GoogleSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            g = google.verify_google_credential(s.validated_data["credential"])
        except services.OTPError as e:
            return Response({"detail": e.message}, status=e.status)

        user = services.user_for_google(g["sub"])
        if user:
            if not user.is_active:
                return Response({"detail": "This account is disabled."}, status=403)
            payload = services.user_payload(user)
            return Response(
                {**services.issue_tokens(user), "is_new": payload is None, "user": payload}
            )

        if services.email_taken(g["email"]):
            return Response(
                {"detail": "An account with this email already exists. Log in with your phone number instead."},
                status=409,
            )
        return Response(
            {
                "is_new": True,
                "signup_token": google.make_signup_token(g),
                "google": {"name": g["name"], "email": g["email"]},
            }
        )


class GoogleRegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        s = GoogleRegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        try:
            g = google.read_signup_token(d["signup_token"])
            user = services.create_google_user(
                sub=g["sub"],
                email=g["email"],
                name=d["name"].strip(),
                city=d.get("city", "").strip(),
                role=d["role"],
            )
        except services.OTPError as e:
            return Response({"detail": e.message}, status=e.status)

        return Response({**services.issue_tokens(user), "user": services.user_payload(user)})