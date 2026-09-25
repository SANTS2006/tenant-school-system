import pytest

from apps.tenants.context import (
    reset_current_school_id,
    reset_platform_admin_context,
    set_current_school_id,
    set_platform_admin_context,
)
from tests.factories import PlatformAdminFactory, SchoolFactory, UserFactory

from .models import Role
from .services import (
    ALL_PERMISSIONS_SENTINEL,
    assign_role,
    get_user_permission_codes,
    seed_default_roles_for_school,
    seed_permission_catalog,
)

pytestmark = pytest.mark.django_db


class TestPermissionScoping:
    def test_user_only_gets_permissions_from_their_own_school(self):
        seed_permission_catalog()
        school_a = SchoolFactory()
        school_b = SchoolFactory()
        seed_default_roles_for_school(school_a)
        seed_default_roles_for_school(school_b)

        teacher_a = UserFactory(school=school_a)
        accountant_b = UserFactory(school=school_b)

        assign_role(user=teacher_a, role=Role.unscoped_objects.get(school=school_a, slug="teacher"))
        assign_role(user=accountant_b, role=Role.unscoped_objects.get(school=school_b, slug="accountant"))

        teacher_a_codes = get_user_permission_codes(teacher_a)
        accountant_b_codes = get_user_permission_codes(accountant_b)

        assert "education.create" in teacher_a_codes
        assert "fees.view" not in teacher_a_codes  # accountant-only permission, different school
        assert "fees.view" in accountant_b_codes
        assert "education.create" not in accountant_b_codes

    def test_platform_admin_gets_all_permissions_sentinel(self):
        admin = PlatformAdminFactory()
        assert get_user_permission_codes(admin) == {ALL_PERMISSIONS_SENTINEL}

    def test_assign_role_is_idempotent_outside_request_context(self):
        """
        Regression test: assign_role() must use UserRole.unscoped_objects,
        not the tenant-scoped `objects` manager. Outside a request (no
        tenant context set — exactly the situation in a management command
        or this test), `objects.get_or_create()` silently misses the
        existing row (scoped queries return `.none()` with no context) and
        tries to re-insert it, raising a duplicate-key IntegrityError on
        the second call.
        """
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        user = UserFactory(school=school)
        role = Role.unscoped_objects.get(school=school, slug="teacher")

        assign_role(user=user, role=role)
        assign_role(user=user, role=role)  # must not raise IntegrityError

        from .models import UserRole

        assert UserRole.unscoped_objects.filter(user=user, role=role).count() == 1

    def test_assign_role_rejects_cross_school_role(self):
        school_a = SchoolFactory()
        school_b = SchoolFactory()
        seed_default_roles_for_school(school_b)

        user_in_a = UserFactory(school=school_a)
        role_in_b = Role.unscoped_objects.get(school=school_b, slug="teacher")

        with pytest.raises(ValueError):
            assign_role(user=user_in_a, role=role_in_b)


class TestTenantManagerScoping:
    def test_returns_empty_without_tenant_context(self):
        school = SchoolFactory()
        seed_default_roles_for_school(school)

        assert list(Role.objects.all()) == []

    def test_scopes_to_current_school_only(self):
        school_a = SchoolFactory()
        school_b = SchoolFactory()
        seed_default_roles_for_school(school_a)
        seed_default_roles_for_school(school_b)

        token = set_current_school_id(school_a.id)
        try:
            visible_schools = {role.school_id for role in Role.objects.all()}
        finally:
            reset_current_school_id(token)

        assert visible_schools == {school_a.id}

    def test_platform_admin_context_sees_all_schools(self):
        school_a = SchoolFactory()
        school_b = SchoolFactory()
        seed_default_roles_for_school(school_a)
        seed_default_roles_for_school(school_b)

        admin_token = set_platform_admin_context(True)
        try:
            visible_schools = {role.school_id for role in Role.objects.all()}
        finally:
            reset_platform_admin_context(admin_token)

        assert school_a.id in visible_schools
        assert school_b.id in visible_schools
