import re

from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User

PHONE_RE = re.compile(r"^\+?\d{10,15}$")


def clean_phone(value, instance=None):
    value = re.sub(r"[\s\-()]", "", value or "")
    if not value:
        return ""
    if not PHONE_RE.match(value):
        raise serializers.ValidationError("Enter a valid phone number, e.g. +919876543210.")
    others = User.objects.filter(phone=value)
    if instance is not None:
        others = others.exclude(pk=instance.pk)
    if others.exists():
        raise serializers.ValidationError("This phone number is already in use.")
    return value


class UserSerializer(serializers.ModelSerializer):
    """What the API shows about a user. Only name and phone can be edited."""

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "phone", "role", "created_at")
        read_only_fields = ("id", "email", "role", "created_at")

    def validate_phone(self, value):
        return clean_phone(value, self.instance)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    # Admin accounts can never be created through the public API.
    role = serializers.ChoiceField(
        choices=[User.Role.CUSTOMER, User.Role.TASKER], default=User.Role.CUSTOMER
    )

    class Meta:
        model = User
        fields = ("email", "full_name", "phone", "role", "password")

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        return clean_phone(value)

    def validate(self, attrs):
        candidate = User(email=attrs.get("email", ""), full_name=attrs.get("full_name", ""))
        try:
            password_validation.validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    """Email + password in; tokens and the user out. Email is case-insensitive."""

    def validate(self, attrs):
        attrs[self.username_field] = attrs[self.username_field].lower()
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()