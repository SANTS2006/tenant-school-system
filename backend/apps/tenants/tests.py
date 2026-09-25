import pytest

from apps.authorization.models import Role
from apps.authorization.services import assign_role, seed_default_roles_for_school, seed_permission_catalog
from tests.factories import DEFAULT_TEST_PASSWORD, PlatformAdminFactory, SchoolFactory, UserFactory

from .models import School

pytestmark = pytest.mark.django_db


def _login(api_client, email, password=DEFAULT_TEST_PASSWORD):
    return api_client.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")


def _login_as(api_client, user):
    _login(api_client, user.email)


class TestSchoolCreation:
    def test_platform_admin_can_create_school(self, api_client):
        admin = PlatformAdminFactory()
        _login_as(api_client, admin)

        response = api_client.post(
            "/api/v1/schools/",
            {
                "name": "Greenwood High",
                "slug": "greenwood-high",
                "admin_email": "admin@greenwood.test",
                "admin_first_name": "Grace",
                "admin_last_name": "Greenwood",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["school"]["status"] == "pending"

        school = School.objects.get(slug="greenwood-high")
        assert school.name == "Greenwood High"
        # Default roles were seeded and the admin invited + assigned.
        assert Role.unscoped_objects.filter(school=school, slug="school-administrator").exists()

    def test_school_user_cannot_create_school(self, api_client):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        user = UserFactory(school=school)
        assign_role(user=user, role=Role.unscoped_objects.get(school=school, slug="teacher"))
        _login_as(api_client, user)

        response = api_client.post(
            "/api/v1/schools/",
            {
                "name": "X",
                "slug": "x-school",
                "admin_email": "a@x.test",
                "admin_first_name": "A",
                "admin_last_name": "B",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_anonymous_cannot_list_schools(self, api_client):
        response = api_client.get("/api/v1/schools/")
        assert response.status_code == 401


class TestSchoolActivation:
    def test_activate_and_suspend(self, api_client):
        admin = PlatformAdminFactory()
        _login_as(api_client, admin)
        school = SchoolFactory(status=School.Status.PENDING)

        activate = api_client.post(f"/api/v1/schools/{school.id}/activate/")
        assert activate.status_code == 200
        school.refresh_from_db()
        assert school.status == School.Status.ACTIVE

        suspend = api_client.post(
            f"/api/v1/schools/{school.id}/suspend/", {"reason": "Non-payment"}, format="json"
        )
        assert suspend.status_code == 200
        school.refresh_from_db()
        assert school.status == School.Status.SUSPENDED
        assert school.suspended_reason == "Non-payment"


class TestSchoolSelfService:
    def test_school_user_can_view_own_school_only(self, api_client):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        user = UserFactory(school=school)
        assign_role(user=user, role=Role.unscoped_objects.get(school=school, slug="teacher"))
        _login_as(api_client, user)

        response = api_client.get("/api/v1/schools/me/")
        assert response.status_code == 200
        assert response.data["school"]["id"] == str(school.id)

    def test_update_requires_settings_update_permission(self, api_client):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        teacher = UserFactory(school=school)
        assign_role(user=teacher, role=Role.unscoped_objects.get(school=school, slug="teacher"))
        _login_as(api_client, teacher)

        response = api_client.patch("/api/v1/schools/me/", {"motto": "New motto"}, format="json")
        assert response.status_code == 403

    def test_principal_can_update_own_school(self, api_client):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        principal = UserFactory(school=school)
        assign_role(user=principal, role=Role.unscoped_objects.get(school=school, slug="principal"))
        _login_as(api_client, principal)

        response = api_client.patch("/api/v1/schools/me/", {"motto": "Excellence"}, format="json")
        assert response.status_code == 200
        school.refresh_from_db()
        assert school.motto == "Excellence"

    def test_cannot_update_status_via_self_service(self, api_client):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        principal = UserFactory(school=school)
        assign_role(user=principal, role=Role.unscoped_objects.get(school=school, slug="principal"))
        _login_as(api_client, principal)

        response = api_client.patch("/api/v1/schools/me/", {"status": "suspended"}, format="json")
        assert response.status_code == 200
        school.refresh_from_db()
        assert school.status == School.Status.ACTIVE  # unchanged — status is read-only here


class TestPromotionThreshold:
    """Phase 2 — School.promotion_threshold_percent, the cut-off the promotion engine (Phase 7)
    compares a student's three-term overall percentage against."""

    def _principal(self):
        seed_permission_catalog()
        school = SchoolFactory()
        seed_default_roles_for_school(school)
        principal = UserFactory(school=school)
        assign_role(user=principal, role=Role.unscoped_objects.get(school=school, slug="principal"))
        return school, principal

    def test_default_promotion_threshold_is_50(self):
        school = SchoolFactory()
        assert school.promotion_threshold_percent == 50

    def test_principal_can_update_promotion_threshold(self, api_client):
        school, principal = self._principal()
        _login_as(api_client, principal)

        response = api_client.patch("/api/v1/schools/me/", {"promotion_threshold_percent": 65}, format="json")
        assert response.status_code == 200
        school.refresh_from_db()
        assert school.promotion_threshold_percent == 65

    def test_threshold_above_100_rejected(self, api_client):
        school, principal = self._principal()
        _login_as(api_client, principal)

        response = api_client.patch("/api/v1/schools/me/", {"promotion_threshold_percent": 150}, format="json")
        assert response.status_code == 400
        school.refresh_from_db()
        assert school.promotion_threshold_percent == 50

    def test_teacher_without_settings_permission_cannot_update_threshold(self, api_client):
        school, _principal_user = self._principal()
        teacher = UserFactory(school=school)
        assign_role(user=teacher, role=Role.unscoped_objects.get(school=school, slug="teacher"))
        _login_as(api_client, teacher)

        response = api_client.patch("/api/v1/schools/me/", {"promotion_threshold_percent": 70}, format="json")
        assert response.status_code == 403
