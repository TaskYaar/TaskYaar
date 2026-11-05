"apps.otp_auth",






OTP_DEV_CODE = "123456"   # dev only: always use this code when DEBUG=True

import os

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")