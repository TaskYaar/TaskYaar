from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import User

REGISTER = "/api/auth/register/"
LOGIN = "/api/auth/login/"
REFRESH = "/api/auth/refresh/"
LOGOUT = "/api/auth/logout/"
ME = "/api/users/me/"
PASSWORD = "Str0ng!pass123"


class AuthApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset the rate-limit counters between tests

    def register(self, **overrides):
        data = {"email": "asha@example.com", "full_name": "Asha Patil", "password": PASSWORD}
        data.update(overrides)
        return self.client.post(REGISTER, data, format="json")

    def login(self, email="asha@example.com", password=PASSWORD):
        return self.client.post(LOGIN, {"email": email, "password": password}, format="json")

    def as_user(self, access):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    # ---- register
    def test_register_returns_user_and_tokens(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["email"], "asha@example.com")
        self.assertEqual(response.data["user"]["role"], "customer")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertNotIn("password", response.data["user"])
        self.assertTrue(User.objects.get(email="asha@example.com").check_password(PASSWORD))

    def test_register_can_choose_tasker_role(self):
        self.assertEqual(self.register(role="tasker").data["user"]["role"], "tasker")

    def test_register_cannot_create_admin(self):
        response = self.register(role="admin")
        self.assertEqual(response.status_code, 400)
        self.assertIn("role", response.data)

    def test_register_rejects_duplicate_email_ignoring_case(self):
        self.register()
        response = self.register(email="ASHA@example.com")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_register_rejects_weak_password(self):
        response = self.register(password="12345678")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_register_rejects_duplicate_phone(self):
        self.register(phone="+919876543210")
        response = self.register(email="b@example.com", phone="+919876543210")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)

    # ---- login
    def test_login_works_and_email_is_case_insensitive(self):
        self.register()
        response = self.login(email="ASHA@Example.com")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], "asha@example.com")

    def test_login_with_wrong_password_fails(self):
        self.register()
        self.assertEqual(self.login(password="wrong-password").status_code, 401)

    def test_inactive_user_cannot_login(self):
        self.register()
        User.objects.filter(email="asha@example.com").update(is_active=False)
        self.assertEqual(self.login().status_code, 401)

    # ---- me
    def test_me_requires_login(self):
        self.assertEqual(self.client.get(ME).status_code, 401)

    def test_me_returns_own_profile(self):
        self.as_user(self.register().data["access"])
        response = self.client.get(ME)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "asha@example.com")

    def test_me_can_update_name_but_not_role_or_email(self):
        self.as_user(self.register().data["access"])
        response = self.client.patch(
            ME,
            {"full_name": "Asha P.", "role": "admin", "email": "hacker@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(email="asha@example.com")
        self.assertEqual(user.full_name, "Asha P.")
        self.assertEqual(user.role, "customer")

    # ---- refresh and logout
    def test_refresh_returns_new_access_token(self):
        refresh = self.register().data["refresh"]
        response = self.client.post(REFRESH, {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_logout_blocks_the_refresh_token(self):
        refresh = self.register().data["refresh"]
        self.assertEqual(self.client.post(LOGOUT, {"refresh": refresh}, format="json").status_code, 204)
        self.assertEqual(self.client.post(REFRESH, {"refresh": refresh}, format="json").status_code, 401)

    def test_logout_with_garbage_token_is_rejected(self):
        response = self.client.post(LOGOUT, {"refresh": "not-a-token"}, format="json")
        self.assertEqual(response.status_code, 400)