import logging

from django.conf import settings

logger = logging.getLogger("apps")


def send_email(*, to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    """
    Thin wrapper around Brevo's transactional email API. Returns True/False
    rather than raising, so a flaky email provider never breaks a request
    that also needs to persist a DB change — callers should log/audit the
    outcome, not depend on it for control flow.

    Never pass secrets (tokens, passwords) into `html_content` beyond a
    single-use, expiring link — see apps.authentication.tokens.
    """
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not configured; skipping email to %s (subject=%r)", to_email, subject)
        return False

    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email, "name": to_name}],
        sender={"email": settings.BREVO_SENDER_EMAIL, "name": settings.BREVO_SENDER_NAME},
        subject=subject,
        html_content=html_content,
    )
    try:
        api_instance.send_transac_email(email)
        return True
    except ApiException:
        logger.error("Brevo send failed for %s (subject=%r)", to_email, subject, exc_info=True)
        return False
