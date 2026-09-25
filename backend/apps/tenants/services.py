import re

from django.db import transaction

from apps.audit.services import log_action
from apps.authorization.models import Role
from apps.authorization.services import assign_role, seed_default_roles_for_school

from .context import get_current_school_id
from .models import School


def get_current_school() -> School | None:
    """The school for the current request's tenant context — a normal school user's own school,
    or (for a platform admin) whichever school they're currently "viewing" via the acting-school
    header (see apps.tenants.mixins.ACTING_SCHOOL_HEADER). `None` if there's no school in context
    at all (e.g. a platform admin browsing the Platform console itself, not viewing any school).

    Views that need "the current school" as an object — not just for tenant-scoped queryset
    filtering, which `TenantManager` already handles automatically — should use this instead of
    reading `request.user.school` directly, since that's always `None` for a platform admin
    regardless of any acting-school header they've set."""
    school_id = get_current_school_id()
    if school_id is None:
        return None
    return School.objects.filter(pk=school_id).first()


def generate_default_password(school: School) -> str:
    """Every school-scoped user is provisioned with this same, deterministic password —
    initials of each word in the school's name (uppercased) + `@` + the year the school itself
    was created (never the individual user's own invite date, so "reset to default" always
    recomputes the exact same value regardless of when a given user was added). E.g. "Demo
    Academy" created in 2026 -> "DA@2026"."""
    initials = "".join(word[0] for word in re.findall(r"[A-Za-z0-9]+", school.name)).upper()
    return f"{initials}@{school.created_at.year}"


def is_default_password(user, raw_password: str) -> bool:
    """True if `raw_password` is the guessable per-school default for this user's school. Such a
    password must never be *chosen*: it is public knowledge to anyone who knows the school's name."""
    if user.school_id is None or not raw_password:
        return False
    return raw_password.strip().lower() == generate_default_password(user.school).lower()


@transaction.atomic
def create_school(
    *,
    name: str,
    slug: str,
    admin_email: str,
    admin_first_name: str,
    admin_last_name: str,
    created_by=None,
    **school_fields,
) -> School:
    """
    Creates the school (status=pending — a platform admin must explicitly
    activate it), seeds its default roles, and invites the first school
    administrator. The school stays inactive (so its users cannot log in —
    see apps.authentication.views.LoginView) until activated.
    """
    from apps.users.models import User
    from apps.users.services import invite_user

    school = School.objects.create(
        name=name, slug=slug, status=School.Status.PENDING, **school_fields
    )
    seed_default_roles_for_school(school)

    admin_user = invite_user(
        email=admin_email,
        first_name=admin_first_name,
        last_name=admin_last_name,
        school=school,
        user_type=User.UserType.SCHOOL_USER,
        invited_by=created_by,
    )
    admin_role = Role.unscoped_objects.get(school=school, slug="school-administrator")
    assign_role(user=admin_user, role=admin_role, assigned_by=created_by)

    log_action(
        action="platform.school_created",
        actor=created_by,
        school=school,
        entity_type="School",
        entity_id=str(school.pk),
        after={"name": school.name, "slug": school.slug},
    )
    return school


def activate_school(*, school: School, actor=None) -> School:
    school.status = School.Status.ACTIVE
    school.suspended_reason = ""
    school.save(update_fields=["status", "suspended_reason"])
    log_action(
        action="platform.school_activated",
        actor=actor,
        school=school,
        entity_type="School",
        entity_id=str(school.pk),
    )
    return school


def suspend_school(*, school: School, reason: str = "", actor=None) -> School:
    school.status = School.Status.SUSPENDED
    school.suspended_reason = reason
    school.save(update_fields=["status", "suspended_reason"])
    log_action(
        action="platform.school_suspended",
        actor=actor,
        school=school,
        entity_type="School",
        entity_id=str(school.pk),
        severity="warning",
        metadata={"reason": reason},
    )
    return school
