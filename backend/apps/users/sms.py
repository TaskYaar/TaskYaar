import logging

from django.conf import settings
from django.utils.module_loading import import_string

logger = logging.getLogger(__name__)


class ConsoleSMSBackend:
    """Development only: prints the message in the API log instead of sending it."""

    def send(self, phone, message):
        logger.warning("DEV SMS to %s: %s", phone, message)


class LocMemSMSBackend:
    """Used by tests: keeps messages in memory."""

    outbox = []

    def send(self, phone, message):
        type(self).outbox.append((phone, message))


def send_sms(phone, message):
    import_string(settings.SMS_BACKEND)().send(phone, message)