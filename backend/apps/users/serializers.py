from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from .models import User
from .validators import normalize_phone


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Enter a valid phone number.") from None


class VerifyOTPSerializer(SendOTPSerializer):
    otp = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """The user as the app sees them. Phone and role-independent fields are read-only."""

    is_profile_complete = serializers.BooleanField(read_only=True)
    accept_terms = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id", "phone", "email", "full_name", "city", "role",
            "is_profile_complete", "accept_terms", "created_at",
        )
        read_only_fields = ("id", "phone", "created_at")

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return value

    def validate_city(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Enter your city.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if value and User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def update(self, instance, validated_data):
        if validated_data.pop("accept_terms", False) and instance.terms_accepted_at is None:
            instance.terms_accepted_at = timezone.now()
        return super().update(instance, validated_data)