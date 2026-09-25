from django.conf import settings
from django.utils.html import escape

from apps.common.email import send_email


def _wrap(preheader: str, body_html: str) -> str:
    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;
                margin:0 auto;padding:32px 24px;color:#0f172a;">
      <p style="display:none;font-size:1px;color:#f8fafc;">{preheader}</p>
      <h2 style="margin:0 0 8px;font-size:18px;">School Management Platform</h2>
      <div style="margin-top:16px;font-size:14px;line-height:1.6;color:#334155;">
        {body_html}
      </div>
      <p style="margin-top:32px;font-size:12px;color:#94a3b8;">
        If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
    """


def _button(url: str, label: str) -> str:
    return (
        f'<a href="{url}" style="display:inline-block;margin-top:16px;padding:10px 20px;'
        f'background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;'
        f'font-size:14px;">{label}</a>'
    )


def send_invitation_email(*, user, uidb64: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/accept-invitation?uid={uidb64}&token={token}"
    body = f"""
        <p>Hi {escape(user.first_name)},</p>
        <p>You've been invited to join {escape(user.school.name) if user.school else 'the platform'} on the
        School Management Platform. Set your password to activate your account.</p>
        {_button(url, "Accept invitation")}
        <p style="margin-top:16px;">This link expires in 3 days.</p>
    """
    return send_email(
        to_email=user.email,
        to_name=user.full_name,
        subject="You're invited — set up your account",
        html_content=_wrap("You've been invited to the platform", body),
    )


def send_verification_email(*, user, uidb64: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/verify-email?uid={uidb64}&token={token}"
    body = f"""
        <p>Hi {escape(user.first_name)},</p>
        <p>Please confirm your email address.</p>
        {_button(url, "Verify email")}
    """
    return send_email(
        to_email=user.email,
        to_name=user.full_name,
        subject="Verify your email address",
        html_content=_wrap("Please verify your email address", body),
    )


def send_password_reset_email(*, user, uidb64: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/reset-password?uid={uidb64}&token={token}"
    body = f"""
        <p>Hi {escape(user.first_name)},</p>
        <p>We received a request to reset your password. This link expires shortly and can
        only be used once.</p>
        {_button(url, "Reset password")}
        <p style="margin-top:16px;">If you didn't request this, your password is still safe —
        no changes have been made.</p>
    """
    return send_email(
        to_email=user.email,
        to_name=user.full_name,
        subject="Reset your password",
        html_content=_wrap("Reset your password", body),
    )


def send_password_changed_email(*, user) -> bool:
    body = f"""
        <p>Hi {escape(user.first_name)},</p>
        <p>Your password was just changed. If this wasn't you, contact your school
        administrator immediately.</p>
    """
    return send_email(
        to_email=user.email,
        to_name=user.full_name,
        subject="Your password was changed",
        html_content=_wrap("Your password was changed", body),
    )


def send_account_locked_email(*, user, minutes: int) -> bool:
    body = f"""
        <p>Hi {escape(user.first_name)},</p>
        <p>There were several failed sign-in attempts on your account, so we've temporarily
        locked it for {minutes} minutes as a precaution.</p>
        <p>If this was you, wait and try again. If it wasn't, someone may be guessing your
        password &mdash; we recommend resetting it once the lock ends.</p>
    """
    return send_email(
        to_email=user.email,
        to_name=user.full_name,
        subject="Your account was temporarily locked",
        html_content=_wrap("Too many failed sign-in attempts", body),
    )


def send_security_notice_email(*, user, subject: str, message: str) -> bool:
    """Tell the account owner about a security-relevant change, so a takeover can't go unnoticed."""
    body = f"""
        <p>Hi {escape(user.first_name)},</p>
        <p>{escape(message)}</p>
        <p>If you did not do this, contact your administrator straight away and change your password.</p>
    """
    return send_email(
        to_email=user.email,
        to_name=user.full_name,
        subject=subject,
        html_content=_wrap(subject, body),
    )
