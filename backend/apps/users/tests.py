from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import User


class UserModelTests(TestCase):
    def test_create_user_lowercases_email_and_hashes_password(self):
        user = User.objects.create_user(
            email="Asha@Example.COM", password="Str0ng!pass", full_name="Asha"
        )
        self.assertEqual(user.email, "asha@example.com")
        self.assertTrue(user.check_password("Str0ng!pass"))
        self.assertNotEqual(user.password, "Str0ng!pass")
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertFalse(user.is_staff)

    def test_email_is_required(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="x")

    def test_email_must_be_unique(self):
        User.objects.create_user(email="a@example.com", password="x", full_name="A")
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(email="a@example.com", password="x", full_name="B")

    def test_same_non_empty_phone_is_rejected_but_blank_phones_are_fine(self):
        User.objects.create_user(email="a@example.com", password="x", phone="+919876543210")
        User.objects.create_user(email="b@example.com", password="x")
        User.objects.create_user(email="c@example.com", password="x")
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(email="d@example.com", password="x", phone="+919876543210")

    def test_create_superuser_is_admin_staff(self):
        admin = User.objects.create_superuser(
            email="root@example.com", password="Str0ng!pass", full_name="Root"
        )
        self.assertTrue(admin.is_staff and admin.is_superuser)
        self.assertEqual(admin.role, User.Role.ADMIN)