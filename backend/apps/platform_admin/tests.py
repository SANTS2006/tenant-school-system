import pytest

from apps.authorization.models import Role
from apps.authorization.services import assign_role, seed_default_roles_for_school, seed_permission_catalog
from apps.users.models import User
from tests.factories import DEFAULT_TEST_PASSWORD, PlatformAdminFactory, SchoolFactory, UserFactory

pytestmark = pytest.mark.django_db


def _login(api_client, user):
    return api_client.post(
        "/api/v1/auth/login/",
        {"email": user.email, "password": DEFAULT_TEST_PASSWORD},
        format="json",
    )


class TestPlatformAdminAccess:
    def test_school_user_cannot_access_platform_admin_list(self, api_client):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        principal = UserFactory(school=school)
        assign_role(user=principal, role=Role.unscoped_objects.get(school=school, slug="principal"))
        _login(api_client, principal)

        response = api_client.get("/api/v1/platform/admins/")
        assert response.status_code == 403

    def test_school_user_cannot_access_platform_stats(self, api_client):
        school = SchoolFactory()
        user = UserFactory(school=school)
        _login(api_client, user)

        response = api_client.get("/api/v1/platform/stats/")
        assert response.status_code == 403

    def test_platform_admin_can_invite_another_platform_admin(self, api_client):
        admin = PlatformAdminFactory()
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/platform/admins/invite/",
            {"email": "newadmin@platform.test", "first_name": "New", "last_name": "Admin"},
            format="json",
        )
        assert response.status_code == 200
        invited = User.objects.get(email="newadmin@platform.test")
        assert invited.user_type == User.UserType.PLATFORM_ADMIN
        assert invited.school_id is None

    def test_platform_stats_reflects_created_schools(self, api_client):
        admin = PlatformAdminFactory()
        SchoolFactory()
        SchoolFactory()
        _login(api_client, admin)

        response = api_client.get("/api/v1/platform/stats/")
        assert response.status_code == 200
        assert response.data["stats"]["schools_total"] >= 2

    def test_platform_admin_cannot_disable_self(self, api_client):
        admin = PlatformAdminFactory()
        _login(api_client, admin)

        response = api_client.post(f"/api/v1/platform/admins/{admin.id}/disable/")
        assert response.status_code == 400
