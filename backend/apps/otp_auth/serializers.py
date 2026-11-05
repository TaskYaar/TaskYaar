from rest_framework import serializers

from .services import PHONE_RE


class PhoneSerializer(serializers.Serializer):
    phone = serializers.CharField()

    def validate_phone(self, value):
        value = value.strip().replace(" ", "")
        if not PHONE_RE.match(value):
            raise serializers.ValidationError("Enter a valid Indian mobile number.")
        return value


class VerifySerializer(PhoneSerializer):
    otp = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    city = serializers.CharField(max_length=80, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["poster", "helper", "both"], default="both")


class GoogleSerializer(serializers.Serializer):
    credential = serializers.CharField()


class GoogleRegisterSerializer(RegisterSerializer):
    signup_token = serializers.CharField()