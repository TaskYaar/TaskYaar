import hashlib
import hmac
import logging
import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from .models import GoogleIdentity, PhoneOTP

logger = logging.getLogger(__name__)
User = get_user_model()

# >>> CHECK THIS: the name of the phone field on your user model <<<
PHONE_FIELD = "phone"

OTP_TTL = timedelta(minutes=5)
RESEND_AFTER = 30  # seconds
MAX_ATTEMPTS = 5
PHONE_RE = re.compile(r"^\+91[6-9]\d{9}$")


class OTPError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def _hash(phone, code):
    return hmac.new(
        settings.SECRET_KEY.encode(), f"{phone}:{code}".encode(), hashlib.sha256
    ).hexdigest()


def _deliver(phone, code):
    """Send the code. Plug your SMS provider in here (MSG91, Twilio, ...)."""
    if settings.DEBUG:
        logger.warning("DEV OTP for %s is %s", phone, code)
        print(f"\n=== DEV OTP for {phone}: {code} ===\n", flush=True)
        return
    raise OTPError("SMS provider is not configured yet.", 503)


def send_otp(phone):
    now = timezone.now()

    last = PhoneOTP.objects.filter(phone=phone).first()
    if last:
        wait = RESEND_AFTER - (now - last.created_at).total_seconds()
        if wait > 0:
            raise OTPError(
                f"Please wait {int(wait) + 1} seconds before requesting a new code.", 429
            )

    code = getattr(settings, "OTP_DEV_CODE", None) if settings.DEBUG else None
    code = code or f"{secrets.randbelow(10**6):06d}"

    with transaction.atomic():
        PhoneOTP.objects.filter(phone=phone, used=False).update(used=True)
        PhoneOTP.objects.create(
            phone=phone, code_hash=_hash(phone, code), expires_at=now + OTP_TTL
        )
        _deliver(phone, code)  # if this fails, the new row is rolled back


def verify_otp(phone, code):
    otp = PhoneOTP.objects.filter(
        phone=phone, used=False, expires_at__gt=timezone.now()
    ).first()
    if not otp:
        raise OTPError("Code expired. Please request a new one.")
    if otp.attempts >= MAX_ATTEMPTS:
        raise OTPError("Too many wrong attempts. Please request a new code.", 429)

    if not hmac.compare_digest(otp.code_hash, _hash(phone, code)):
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        raise OTPError("Incorrect code. Please try again.")

    otp.used = True
    otp.save(update_fields=["used"])


def _field_names():
    return {f.name for f in User._meta.get_fields()}


def get_or_create_user(phone):
    user = User.objects.filter(**{PHONE_FIELD: phone}).first()
    if user:
        return user, False

    kwargs = {PHONE_FIELD: phone}
    if "username" in _field_names():
        kwargs["username"] = phone
    user = User(**kwargs)
    user.set_unusable_password()
    user.save()
    return user, True


def user_payload(user):
    """Shape the frontend expects. None means the profile isn't filled in yet."""
    name = (getattr(user, "full_name", "") or "").strip()
    if not name:
        return None
    phone = getattr(user, PHONE_FIELD, "") or ""
    return {
        "id": str(user.pk),
        "phone": phone.removeprefix("+91"),
        "name": name,
        "email": getattr(user, "email", "") or "",
        "city": getattr(user, "city", "") or "",
        "role": getattr(user, "role", "") or "both",
    }


def update_profile(user, *, name, email="", city="", role="both"):
    fields = _field_names()
    values = {"full_name": name, "city": city, "role": role}
    if email:
        values["email"] = email

    changed = []
    for key, value in values.items():
        if key in fields:
            setattr(user, key, value)
            changed.append(key)
    user.save(update_fields=changed)
    return user


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def user_for_google(sub):
    ident = GoogleIdentity.objects.filter(sub=sub).select_related("user").first()
    return ident.user if ident else None


def email_taken(email):
    if "email" not in _field_names():
        return False
    return User.objects.filter(email__iexact=email).exists()


@transaction.atomic
def create_google_user(*, sub, email, name, city="", role="both"):
    existing = user_for_google(sub)
    if existing:
        return existing
    if email_taken(email):
        raise OTPError(
            "An account with this email already exists. Log in with your phone number instead.",
            409,
        )

    fields = _field_names()
    kwargs = {}
    if "email" in fields:
        kwargs["email"] = email
    if "username" in fields:
        kwargs["username"] = email
    if User._meta.get_field(PHONE_FIELD).null:
        kwargs[PHONE_FIELD] = None

    user = User(**kwargs)
    user.set_unusable_password()
    user.save()
    GoogleIdentity.objects.create(user=user, sub=sub)
    update_profile(user, name=name, city=city, role=role)
    return user