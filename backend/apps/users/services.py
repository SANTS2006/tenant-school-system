from django.db import transaction

from apps.audit.services import log_action

from .models import User


@transaction.atomic
def invite_user(
    *,
    email: str,
    first_name: str,
    last_name: str,
    school=None,
    user_type: str = User.UserType.SCHOOL_USER,
    invited_by=None,
) -> User:
    """
    Platform admins: unchanged — an inactive account with an unusable password, activated via
    an emailed invitation link (accept_invitation()). There's no school to derive a password
    from, and platform admins are a small, trusted set, so the link-based flow stays.

    School users: active immediately, with a deterministic default password derived from their
    school (see apps.tenants.services.generate_default_password) rather than an unusable
    password + email link — a school-administrator role can reset any of their users back to
    this same value later (see apps.users.views.ResetPasswordView), which only makes sense if
    the value is knowable/reproducible rather than random. No email is sent for this path: the
    password format is public knowledge to anyone who knows the school's name and creation
    year, so there's nothing secret to transmit, and a plaintext password in an email is a
    pattern worth avoiding even when the "secret" is this weak — the admin who created the
    account already knows the default and can tell the new user directly.
    """
    from apps.authentication.emails import send_invitation_email
    from apps.authentication.tokens import encode_uid, invitation_token

    if user_type == User.UserType.PLATFORM_ADMIN and school is not None:
        raise ValueError("Platform admins cannot belong to a school.")
    if user_type == User.UserType.SCHOOL_USER and school is None:
        raise ValueError("A school is required to invite a school user.")

    if user_type == User.UserType.SCHOOL_USER:
        from apps.tenants.services import generate_default_password

        user = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            school=school,
            user_type=user_type,
            is_active=True,
        )
        user.set_password(generate_default_password(school))
        user.must_change_password = True
        user.save(update_fields=["password", "must_change_password"])
    else:
        user = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            school=school,
            user_type=user_type,
            is_active=False,
        )
        user.set_unusable_password()
        user.save(update_fields=["password"])

        uidb64 = encode_uid(user.pk)
        token = invitation_token.make_token(user)
        send_invitation_email(user=user, uidb64=uidb64, token=token)

    log_action(
        action="users.invited",
        actor=invited_by,
        school=school,
        entity_type="User",
        entity_id=str(user.pk),
        after={"email": user.email, "user_type": user.user_type},
    )
    return user
