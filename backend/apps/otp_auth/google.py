from importlib import import_module

from django.conf import settings
from django.core import signing

from .services import OTPError

SALT = "google-signup"
MAX_AGE = 15 * 60  # the signup step must be finished within 15 minutes


def verify_google_credential(credential):
    if not settings.GOOGLE_CLIENT_ID:
        raise OTPError("Google sign-in is not configured on the server.", 503)

    try:
        g_requests = import_module("google.auth.transport.requests")
        id_token = import_module("google.oauth2.id_token")
    except ImportError as exc:
        raise OTPError("Google sign-in is not configured on the server.", 503) from exc

    try:
        info = id_token.verify_oauth2_token(
            credential,
            g_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError:
        raise OTPError("Google sign-in failed. Please try again.", 401)
    except Exception as exc:
        if not any(base.__name__ == "TransportError" for base in type(exc).__mro__):
            raise
        raise OTPError("Couldn't reach Google. Please try again.", 503) from exc

    if not info.get("email") or not info.get("email_verified"):
        raise OTPError("Your Google email isn't verified.", 401)
    return {"sub": info["sub"], "email": info["email"].lower(), "name": info.get("name", "")}


def make_signup_token(data):
    return signing.dumps(data, salt=SALT)


def read_signup_token(token):
    try:
        return signing.loads(token, salt=SALT, max_age=MAX_AGE)
    except signing.BadSignature:
        raise OTPError("Sign-up session expired. Please sign in with Google again.", 400)