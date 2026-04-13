"""
Email sending via Resend (https://resend.com).
Falls back silently if RESEND_API_KEY is not configured.
"""
import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def _configured() -> bool:
    return bool(settings.RESEND_API_KEY)


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password-reset email containing a link with the token."""
    if not _configured():
        logger.warning("RESEND_API_KEY not set — skipping password reset email")
        return

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    resend.api_key = settings.RESEND_API_KEY

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 4px;">
        <span style="background: linear-gradient(to right, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Work</span><span style="background: linear-gradient(to right, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Hive</span>
      </h1>
      <p style="color: #64748b; margin: 0 0 32px; font-size: 14px;">Платформа для студентів і компаній</p>

      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px;">Скидання пароля</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
        Ви (або хтось від вашого імені) запросили скидання пароля для акаунту <strong>{to_email}</strong>.
        Натисніть кнопку нижче, щоб встановити новий пароль. Посилання дійсне <strong>30 хвилин</strong>.
      </p>

      <a href="{reset_url}"
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #6366f1, #8b5cf6);
                color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
        Встановити новий пароль
      </a>

      <p style="color: #94a3b8; font-size: 13px; margin: 28px 0 0; line-height: 1.5;">
        Якщо ви не запитували скидання пароля — просто проігноруйте цей лист. Ваш пароль не зміниться.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #cbd5e1; font-size: 12px; margin: 0;">
        © 2025 WorkHive. Цей лист надіслано автоматично, не відповідайте на нього.
      </p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "WorkHive — скидання пароля",
            "html": html,
        })
        logger.info("Password reset email sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send reset email to %s: %s", to_email, exc)
        # Fallback: log the reset URL so it can be used directly from server logs
        logger.warning("RESET LINK (use this if email failed): %s", reset_url)
