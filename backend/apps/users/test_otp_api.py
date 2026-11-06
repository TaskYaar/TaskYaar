from datetime import timedelta

from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import PhoneOTP, User
from .sms import LocMemSMSBackend

SEND = "/api/auth/send-otp/"
VERIFY = "/api/auth/verify-otp/"
REFRESH = "/api/auth/refresh/"
LOGOUT = "/api/auth/logout/"
ME = "/api/users/me/"
PHONE = "+919876543210"
CODE = "123456"


@override_settings(OTP_FIXED_CODE=CODE, SMS_BACKEND="apps.users.sms.LocMemSMSBackend")
class OtpApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset rate-limit counters
        LocMemSMSBackend.outbox.clear()

    def send(self, phone=PHONE):
        return self.client.post(SEND, {"phone": phone}, format="json")

    def verify(self, code=CODE, phone=PHONE):
        return self.client.post(VERIFY, {"phone": phone, "otp": code}, format="json")

    def skip_cooldown(self):
        PhoneOTP.objects.update(created_at=timezone.now() - timedelta(minutes=1))

    def login(self):
        self.send()
        response = self.verify()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response

    # ---- send
    def test_send_accepts_ten_digit_number_and_sends_sms(self):
        response = self.send("9876543210")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(LocMemSMSBackend.outbox), 1)
        phone, message = LocMemSMSBackend.outbox[0]
        self.assertEqual(phone, PHONE)
        self.assertIn(CODE, message)

    def test_send_rejects_invalid_phone(self):
        response = self.send("12345")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)

    def test_cannot_resend_within_cooldown(self):
        self.assertEqual(self.send().status_code, 200)
        self.assertEqual(self.send().status_code, 429)

    def test_hourly_limit(self):
        for _ in range(5):
            self.assertEqual(self.send().status_code, 200)
            self.skip_cooldown()
        self.assertEqual(self.send().status_code, 429)

    def test_otp_is_stored_hashed(self):
        self.send()
        self.assertNotEqual(PhoneOTP.objects.get().code_hash, CODE)

    # ---- verify
    def test_verify_creates_user_and_returns_tokens(self):
        self.send()
        response = self.verify()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertTrue(response.data["is_new"])
        self.assertIsNone(response.data["user"])
        self.assertIsNotNone(User.objects.get(phone=PHONE).phone_verified_at)

    def test_returning_user_gets_profile_back(self):
        User.objects.create_user(phone=PHONE, full_name="Asha Patil", city="Pune")
        self.send()
        response = self.verify()
        self.assertFalse(response.data["is_new"])
        self.assertEqual(response.data["user"]["full_name"], "Asha Patil")
        self.assertEqual(User.objects.count(), 1)

    def test_wrong_code_is_rejected_and_counted(self):
        self.send()
        response = self.verify("000000")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Incorrect code. Please try again.")
        self.assertEqual(PhoneOTP.objects.get().attempts, 1)
        self.assertFalse(User.objects.exists())

    def test_code_cannot_be_used_twice(self):
        self.send()
        self.assertEqual(self.verify().status_code, 200)
        self.assertEqual(self.verify().status_code, 400)

    def test_too_many_wrong_attempts_blocks_even_the_right_code(self):
        self.send()
        for _ in range(5):
            self.assertEqual(self.verify("000000").status_code, 400)
        self.assertEqual(self.verify().status_code, 400)
        self.assertFalse(User.objects.exists())

    def test_expired_code_is_rejected(self):
        self.send()
        PhoneOTP.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.verify().status_code, 400)

    def test_verify_without_requesting_a_code(self):
        self.assertEqual(self.verify().status_code, 400)

    def test_verify_requires_six_digits(self):
        self.send()
        self.assertEqual(self.verify("12").status_code, 400)

    def test_inactive_user_cannot_log_in(self):
        User.objects.create_user(phone=PHONE, is_active=False)
        self.send()
        self.assertEqual(self.verify().status_code, 400)

    # ---- profile
    def test_me_requires_login(self):
        self.assertEqual(self.client.get(ME).status_code, 401)

    def test_new_user_completes_profile(self):
        self.login()
        response = self.client.patch(
            ME,
            {"full_name": "Asha Patil", "city": "Pune", "role": "helper",
             "email": "Asha@Example.com", "accept_terms": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_profile_complete"])
        self.assertEqual(response.data["email"], "asha@example.com")
        self.assertEqual(response.data["role"], "helper")
        self.assertIsNotNone(User.objects.get(phone=PHONE).terms_accepted_at)

    def test_phone_cannot_be_changed(self):
        self.login()
        self.client.patch(ME, {"phone": "+911111111111"}, format="json")
        self.assertTrue(User.objects.filter(phone=PHONE).exists())

    def test_profile_validation(self):
        self.login()
        self.assertEqual(self.client.patch(ME, {"full_name": "A"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(ME, {"role": "admin"}, format="json").status_code, 400)

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(phone="+919999999999", email="taken@example.com")
        self.login()
        response = self.client.patch(ME, {"email": "Taken@example.com"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_refresh_rotates_token_and_logout_cancels_the_current_one(self):
        self.send()
        first = self.verify().data["refresh"]

        rotated = self.client.post(REFRESH, {"refresh": first}, format="json")
        self.assertEqual(rotated.status_code, 200)
        second = rotated.data["refresh"]
        self.assertNotEqual(first, second)

        # Rotation cancelled the old token, so it cannot be used again.
        self.assertEqual(self.client.post(REFRESH, {"refresh": first}, format="json").status_code, 401)

        # Logout cancels the current token.
        self.assertEqual(self.client.post(LOGOUT, {"refresh": second}, format="json").status_code, 204)
        self.assertEqual(self.client.post(REFRESH, {"refresh": second}, format="json").status_code, 401)