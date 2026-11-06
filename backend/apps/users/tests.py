from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import User
from .validators import normalize_phone


class NormalizePhoneTests(TestCase):
    def test_accepts_valid_numbers(self):
        cases = {
            "9876543210": "+919876543210",
            "98765 43210": "+919876543210",
            "919876543210": "+919876543210",
            "+91 98765-43210": "+919876543210",
            "+14155552671": "+14155552671",
        }
        for raw, expected in cases.items():
            self.assertEqual(normalize_phone(raw), expected, raw)

    def test_rejects_invalid_numbers(self):
        for raw in ["", "12345", "abcdefghij", "5876543210", "+0123456789"]:
            with self.assertRaises(ValidationError, msg=raw):
                normalize_phone(raw)


class UserModelTests(TestCase):
    def test_create_user_normalises_phone_and_has_no_password(self):
        user = User.objects.create_user(phone="9876543210", full_name="Asha")
        self.assertEqual(user.phone, "+919876543210")
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.role, User.Role.BOTH)
        self.assertFalse(user.is_staff)
        self.assertEqual(len(str(user.pk)), 36)

    def test_phone_is_required_and_must_be_valid(self):
        for bad in ["", "123"]:
            with self.assertRaises(ValidationError):
                User.objects.create_user(phone=bad)

    def test_phone_must_be_unique(self):
        User.objects.create_user(phone="9876543210")
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(phone="+919876543210")

    def test_blank_emails_can_repeat_but_real_emails_cannot(self):
        User.objects.create_user(phone="9876543210", email="")
        User.objects.create_user(phone="9876543211", email="")
        User.objects.create_user(phone="9876543212", email="A@Example.com")
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(phone="9876543213", email="a@example.com")

    def test_superuser_needs_password_and_gets_flags(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(phone="9876543214")
        admin = User.objects.create_superuser(phone="9876543214", password="Str0ng!pass")
        self.assertTrue(admin.is_staff and admin.is_superuser)
        self.assertTrue(admin.check_password("Str0ng!pass"))

    def test_profile_complete_needs_name_and_city(self):
        user = User.objects.create_user(phone="9876543215")
        self.assertFalse(user.is_profile_complete)
        user.full_name = "Asha Patil"
        self.assertFalse(user.is_profile_complete)
        user.city = "Pune"
        self.assertTrue(user.is_profile_complete)