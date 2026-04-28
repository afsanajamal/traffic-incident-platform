from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import Settings


logger = logging.getLogger(__name__)


def invitation_url(settings: Settings, token: str) -> str:
    return f"{settings.frontend_base_url.rstrip('/')}/?invite={token}"


def send_invitation_email(
    *,
    settings: Settings,
    recipient_email: str,
    role: str,
    token: str,
) -> bool:
    if not settings.smtp_host:
        logger.info("SMTP_HOST is not configured; invitation email was not sent")
        return False

    register_url = invitation_url(settings, token)
    message = EmailMessage()
    message["Subject"] = "Traffic Incident Platform invitation"
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
    message["To"] = recipient_email
    message.set_content(
        "\n".join(
            [
                "You have been invited to Traffic Incident Platform.",
                "",
                f"Assigned role: {role.replace('_', ' ')}",
                "",
                "Open this link to register:",
                register_url,
                "",
                "This invitation expires in 7 days.",
            ]
        )
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except OSError as exc:
        logger.warning("failed to send invitation email to %s: %s", recipient_email, exc)
        return False

    return True
