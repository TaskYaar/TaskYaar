import re

from django.core.exceptions import ValidationError

_E164 = re.compile(r"^\+[1-9]\d{7,14}$")
_INDIA_MOBILE = re.compile(r"^[6-9]\d{9}$")


def normalize_phone(raw):
    """Return the phone as E.164 (+919876543210) or raise ValidationError.

    A bare 10-digit Indian mobile number gets +91. Other countries need the full +code.
    """
    value = re.sub(r"[\s\-().]", "", str(raw or ""))
    if value.startswith("+"):
        candidate = value
    elif _INDIA_MOBILE.match(value):
        candidate = "+91" + value
    elif value.startswith("91") and _INDIA_MOBILE.match(value[2:]):
        candidate = "+" + value
    else:
        raise ValidationError("Enter a valid phone number.", code="invalid_phone")
    if not _E164.match(candidate):
        raise ValidationError("Enter a valid phone number.", code="invalid_phone")
    return candidate