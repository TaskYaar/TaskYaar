import logging
import secrets
from datetime import timedelta
from math import ceil

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac
from rest_framework.exceptions import APIException, Throttled
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PhoneOTP, User
from .sms import send_sms

logger = logging.getLogger(__name__)

OTP_LENGTH = 6
OTP_TTL = timedelta(minutes=5)
RESEND_COOLDOWN = timedelta(seconds=30)
MAX_SENDS_PER_HOUR = 5
MAX_ATTEMPTS = 5


class OTPError(APIException):
    status_code = 400
    default_detail = "Invalid code."
    default_code = "invalid_otp"


class SMSUnavailable(APIException):
    status_code = 503
    default_detail = "Could not send the code right now. Please try again."
    default_code = "sms_unavailable"


def _hash(phone, code):
    return salted_hmac("taskyaar.otp", f"{phone}:{code}").hexdigest()


def _new_code():
    if settings.OTP_FIXED_CODE:  # development only; blocked in production by settings
        return settings.OTP_FIXED_CODE
    return f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"


def send_otp(*, phone):
    now = timezone.now()
    recent = PhoneOTP.objects.filter(phone=phone, created_at__gte=now - timedelta(hours=1))
    if recent.count() >= MAX_SENDS_PER_HOUR:
        raise Throttled(detail="Too many codes requested. Please try again later.")
    last = recent.order_by("-created_at").first()
    if last and now - last.created_at < RESEND_COOLDOWN:
        wait = ceil((RESEND_COOLDOWN - (now - last.created_at)).total_seconds())
        raise Throttled(wait=wait, detail=f"Please wait {wait} seconds before asking for a new code.")

    code = _new_code()
    try:
        with transaction.atomic():
            PhoneOTP.objects.create(
                phone=phone, code_hash=_hash(phone, code), expires_at=now + OTP_TTL
            )
            send_sms(phone, f"{code} is your TaskYaar verification code. It expires in 5 minutes.")
    except Exception:
        # If the SMS fails, the OTP row is rolled back so it doesn't use up the hourly limit.
        logger.exception("Could not send OTP SMS")
        raise SMSUnavailable() from None


def verify_otp(*, phone, code):
    """Check the code. Returns the user (created on first login) or raises OTPError.

    The attempt counter is saved even when the code is wrong, so the error is raised
    only after the transaction has committed.
    """
    now = timezone.now()
    error = None
    user = None
    with transaction.atomic():
        otp = (
            PhoneOTP.objects.select_for_update()
            .filter(phone=phone, consumed_at__isnull=True, expires_at__gt=now)
            .order_by("-created_at")
            .first()
        )
        if otp is None:
            error = "Code expired or not requested. Please ask for a new code."
        elif otp.attempts >= MAX_ATTEMPTS:
            error = "Too many wrong attempts. Please ask for a new code."
        else:
            otp.attempts += 1
            if constant_time_compare(otp.code_hash, _hash(phone, code)):
                otp.consumed_at = now
            else:
                error = "Incorrect code. Please try again."
            otp.save(update_fields=["attempts", "consumed_at"])

        if error is None:
            user = User.objects.filter(phone=phone).first()
            if user is None:
                user = User.objects.create_user(phone=phone)
            if not user.is_active:
                error = "This account is disabled."
            elif user.phone_verified_at is None:
                user.phone_verified_at = now
                user.save(update_fields=["phone_verified_at", "updated_at"])
    if error:
        raise OTPError(error)
    return user


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}