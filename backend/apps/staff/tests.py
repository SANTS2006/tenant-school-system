import pytest

from apps.authorization.models import Role
from apps.authorization.services import assign_role, seed_default_roles_for_school, seed_permission_catalog
from tests.factories import DEFAULT_TEST_PASSWORD, SchoolFactory, StaffFactory, UserFactory

from .models import Staff

pytestmark = pytest.mark.django_db


def _login(api_client, user):
    return api_client.post(
        "/api/v1/auth/login/", {"email": user.email, "password": DEFAULT_TEST_PASSWORD}, format="json"
    )


def _principal():
    seed_permission_catalog()
    school = SchoolFactory()
    seed_default_roles_for_school(school)
    principal = UserFactory(school=school)
    assign_role(user=principal, role=Role.unscoped_objects.get(school=school, slug="principal"))
    return school, principal


class TestStaffCreate:
    def test_principal_can_create_staff_profile_for_own_school_user(self, api_client):
        school, principal = _principal()
        new_user = UserFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/staff/",
            {"user": str(new_user.id), "job_title": "Mathematics Teacher"},
            format="json",
        )
        assert response.status_code == 201
        staff = Staff.unscoped_objects.get(user=new_user)
        assert staff.school_id == school.id

    def test_cannot_create_staff_profile_for_another_schools_user(self, api_client):
        school_a, principal_a = _principal()
        school_b, _ = _principal()
        user_b = UserFactory(school=school_b)

        _login(api_client, principal_a)
        response = api_client.post(
            "/api/v1/staff/", {"user": str(user_b.id), "job_title": "X"}, format="json"
        )
        assert response.status_code == 400

    def test_cannot_double_assign_staff_profile(self, api_client):
        school, principal = _principal()
        staff = StaffFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/staff/", {"user": str(staff.user_id), "job_title": "Duplicate"}, format="json"
        )
        assert response.status_code == 400


class TestStaffTenantIsolation:
    def test_cannot_list_another_schools_staff(self, api_client):
        school_a, principal_a = _principal()
        school_b, _ = _principal()
        StaffFactory(school=school_b)
        staff_a = StaffFactory(school=school_a)

        _login(api_client, principal_a)
        response = api_client.get("/api/v1/staff/")

        assert response.status_code == 200
        ids_seen = {row["id"] for row in response.data["results"]}
        assert str(staff_a.id) in ids_seen
        assert len(ids_seen) == 1

    def test_cannot_retrieve_another_schools_staff_by_id(self, api_client):
        school_a, principal_a = _principal()
        school_b, _ = _principal()
        staff_b = StaffFactory(school=school_b)

        _login(api_client, principal_a)
        response = api_client.get(f"/api/v1/staff/{staff_b.id}/")
        assert response.status_code == 404


class TestStaffTermination:
    def test_delete_terminates_rather_than_hard_deletes(self, api_client):
        school, principal = _principal()
        staff = StaffFactory(school=school)
        _login(api_client, principal)

        response = api_client.delete(f"/api/v1/staff/{staff.id}/")
        assert response.status_code == 204
        staff.refresh_from_db()
        assert staff.employment_status == Staff.EmploymentStatus.TERMINATED

    def test_enable_reactivates(self, api_client):
        school, principal = _principal()
        staff = StaffFactory(school=school, employment_status=Staff.EmploymentStatus.TERMINATED)
        _login(api_client, principal)

        response = api_client.post(f"/api/v1/staff/{staff.id}/enable/")
        assert response.status_code == 200
        staff.refresh_from_db()
        assert staff.employment_status == Staff.EmploymentStatus.ACTIVE
