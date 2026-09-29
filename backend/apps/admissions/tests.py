import pytest

from apps.authorization.models import Role, UserRole
from apps.authorization.services import assign_role, seed_default_roles_for_school, seed_permission_catalog
from apps.staff.models import Staff
from apps.students.models import Student
from apps.users.models import User
from tests.factories import (
    DEFAULT_TEST_PASSWORD,
    SchoolClassFactory,
    SchoolFactory,
    UserFactory,
)

from .models import Application, ApplicationDocument

pytestmark = pytest.mark.django_db


def _login(api_client, user):
    return api_client.post(
        "/api/v1/auth/login/", {"email": user.email, "password": DEFAULT_TEST_PASSWORD}, format="json"
    )


def _school_administrator():
    seed_permission_catalog()
    school = SchoolFactory()
    seed_default_roles_for_school(school)
    admin = UserFactory(school=school)
    assign_role(user=admin, role=Role.unscoped_objects.get(school=school, slug="school-administrator"))
    return school, admin


class TestPublicApplicationOptions:
    def test_returns_classes_and_assignable_roles(self, api_client):
        school, _ = _school_administrator()
        school_class = SchoolClassFactory(school=school)

        response = api_client.get(f"/api/v1/admissions/apply/{school.slug}/options/")

        assert response.status_code == 200
        class_names = [c["name"] for c in response.data["classes"]]
        assert school_class.name in class_names
        role_slugs = {r["name"] for r in response.data["roles"]}
        # "student" is excluded — a staff applicant never applies for the student role.
        assert "Student" not in role_slugs
        assert "Teacher" in role_slugs

    def test_unknown_school_slug_404s(self, api_client):
        response = api_client.get("/api/v1/admissions/apply/no-such-school/options/")
        assert response.status_code == 404

    def test_inactive_school_404s(self, api_client):
        school = SchoolFactory(status="pending")
        response = api_client.get(f"/api/v1/admissions/apply/{school.slug}/options/")
        assert response.status_code == 404


class TestPublicApplySubmission:
    def test_submits_a_student_application_with_documents(self, api_client):
        from django.core.files.uploadedfile import SimpleUploadedFile

        school, _ = _school_administrator()
        school_class = SchoolClassFactory(school=school)

        response = api_client.post(
            f"/api/v1/admissions/apply/{school.slug}/",
            {
                "kind": "student",
                "first_name": "Ama",
                "last_name": "Koroma",
                "email": "ama@example.test",
                "applying_for_class": str(school_class.id),
                "documents": [SimpleUploadedFile("transcript.pdf", b"%PDF-1.4 fake transcript")],
            },
            format="multipart",
        )

        assert response.status_code == 201
        application = Application.unscoped_objects.get(school=school, email="ama@example.test")
        assert application.kind == Application.Kind.STUDENT
        assert application.status == Application.Status.SUBMITTED
        assert application.applying_for_class_id == school_class.id
        assert ApplicationDocument.unscoped_objects.filter(application=application).count() == 1

    def test_student_application_requires_a_class(self, api_client):
        school, _ = _school_administrator()

        response = api_client.post(
            f"/api/v1/admissions/apply/{school.slug}/",
            {"kind": "student", "first_name": "Ama", "last_name": "Koroma", "email": "ama2@example.test"},
            format="multipart",
        )
        assert response.status_code == 400

    def test_submits_a_staff_application(self, api_client):
        school, _ = _school_administrator()
        teacher_role = Role.unscoped_objects.get(school=school, slug="teacher")

        response = api_client.post(
            f"/api/v1/admissions/apply/{school.slug}/",
            {
                "kind": "staff",
                "first_name": "Kofi",
                "last_name": "Mensah",
                "email": "kofi@example.test",
                "applying_for_role": str(teacher_role.id),
                "job_title": "Mathematics Teacher",
            },
            format="multipart",
        )

        assert response.status_code == 201
        application = Application.unscoped_objects.get(school=school, email="kofi@example.test")
        assert application.kind == Application.Kind.STAFF
        assert application.applying_for_role_id == teacher_role.id

    def test_staff_application_requires_a_role(self, api_client):
        school, _ = _school_administrator()

        response = api_client.post(
            f"/api/v1/admissions/apply/{school.slug}/",
            {"kind": "staff", "first_name": "Kofi", "last_name": "Mensah", "email": "kofi2@example.test"},
            format="multipart",
        )
        assert response.status_code == 400

    def test_cannot_apply_for_another_schools_class(self, api_client):
        school, _ = _school_administrator()
        other_school = SchoolFactory()
        other_class = SchoolClassFactory(school=other_school)

        response = api_client.post(
            f"/api/v1/admissions/apply/{school.slug}/",
            {
                "kind": "student",
                "first_name": "Ama",
                "last_name": "Koroma",
                "email": "ama3@example.test",
                "applying_for_class": str(other_class.id),
            },
            format="multipart",
        )
        assert response.status_code == 400

    def test_unknown_school_slug_404s(self, api_client):
        response = api_client.post(
            "/api/v1/admissions/apply/no-such-school/",
            {"kind": "student", "first_name": "A", "last_name": "B", "email": "a@example.test"},
            format="multipart",
        )
        assert response.status_code == 404


class TestApplicationAdminList:
    def test_school_administrator_can_list_applications(self, api_client):
        school, admin = _school_administrator()
        Application.objects.create(school=school, kind="student", first_name="A", last_name="B", email="a@b.test")
        _login(api_client, admin)

        response = api_client.get("/api/v1/admissions/applications/")

        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_teacher_without_permission_cannot_list(self, api_client):
        school, _ = _school_administrator()
        teacher = UserFactory(school=school)
        assign_role(user=teacher, role=Role.unscoped_objects.get(school=school, slug="teacher"))
        _login(api_client, teacher)

        response = api_client.get("/api/v1/admissions/applications/")
        assert response.status_code == 403

    def test_cannot_list_another_schools_applications(self, api_client):
        school, admin = _school_administrator()
        other_school = SchoolFactory()
        Application.objects.create(
            school=other_school, kind="student", first_name="X", last_name="Y", email="x@y.test"
        )
        _login(api_client, admin)

        response = api_client.get("/api/v1/admissions/applications/")
        assert response.data["count"] == 0


class TestBulkShortlist:
    def test_shortlists_selected_applications(self, api_client):
        school, admin = _school_administrator()
        application = Application.objects.create(
            school=school, kind="student", first_name="A", last_name="B", email="a@b.test"
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/bulk-shortlist/",
            {"application_ids": [str(application.id)]},
            format="json",
        )

        assert response.status_code == 200
        application.refresh_from_db()
        assert application.status == Application.Status.SHORTLISTED


class TestInviteInterview:
    def test_sets_interview_details_and_status(self, api_client):
        school, admin = _school_administrator()
        application = Application.objects.create(
            school=school, kind="student", first_name="A", last_name="B", email="a@b.test"
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/invite-interview/",
            {
                "application_ids": [str(application.id)],
                "interview_datetime": "2026-02-01T10:00:00Z",
                "interview_location": "Main office",
                "interview_notes": "Bring your certificates.",
            },
            format="json",
        )

        assert response.status_code == 200
        application.refresh_from_db()
        assert application.status == Application.Status.INTERVIEW_SCHEDULED
        assert application.interview_location == "Main office"

    def test_requires_a_datetime(self, api_client):
        school, admin = _school_administrator()
        application = Application.objects.create(
            school=school, kind="student", first_name="A", last_name="B", email="a@b.test"
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/invite-interview/",
            {"application_ids": [str(application.id)]},
            format="json",
        )
        assert response.status_code == 400


class TestBulkAccept:
    def test_accepts_a_student_application(self, api_client):
        school, admin = _school_administrator()
        school_class = SchoolClassFactory(school=school)
        application = Application.objects.create(
            school=school,
            kind="student",
            first_name="Ama",
            last_name="Koroma",
            email="ama@example.test",
            applying_for_class=school_class,
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/bulk-accept/",
            {"application_ids": [str(application.id)]},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["accepted"] == 1
        assert response.data["skipped"] == []
        application.refresh_from_db()
        assert application.status == Application.Status.ACCEPTED
        student = Student.unscoped_objects.get(school=school, first_name="Ama", last_name="Koroma")
        assert student.status == Student.Status.ADMITTED
        assert student.current_class_id == school_class.id
        assert student.user_id is not None
        assert application.created_student_id == student.id

    def test_accepts_a_staff_application(self, api_client):
        school, admin = _school_administrator()
        teacher_role = Role.unscoped_objects.get(school=school, slug="teacher")
        application = Application.objects.create(
            school=school,
            kind="staff",
            first_name="Kofi",
            last_name="Mensah",
            email="kofi@example.test",
            applying_for_role=teacher_role,
            job_title="Mathematics Teacher",
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/bulk-accept/",
            {"application_ids": [str(application.id)]},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["accepted"] == 1
        application.refresh_from_db()
        assert application.status == Application.Status.ACCEPTED
        user = User.objects.get(school=school, email="kofi@example.test")
        staff = Staff.unscoped_objects.get(school=school, user=user)
        assert staff.employment_status == Staff.EmploymentStatus.ACTIVE
        assert staff.job_title == "Mathematics Teacher"
        assert UserRole.unscoped_objects.filter(user=user, role=teacher_role).exists()

    def test_skips_a_student_application_with_no_class_specified(self, api_client):
        school, admin = _school_administrator()
        application = Application.objects.create(
            school=school, kind="student", first_name="A", last_name="B", email="a@b.test"
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/bulk-accept/",
            {"application_ids": [str(application.id)]},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["accepted"] == 0
        assert len(response.data["skipped"]) == 1
        application.refresh_from_db()
        assert application.status == Application.Status.SUBMITTED

    def test_skips_a_staff_application_whose_email_already_has_an_account(self, api_client):
        school, admin = _school_administrator()
        teacher_role = Role.unscoped_objects.get(school=school, slug="teacher")
        UserFactory(school=school, email="taken@example.test")
        application = Application.objects.create(
            school=school,
            kind="staff",
            first_name="Kofi",
            last_name="Mensah",
            email="taken@example.test",
            applying_for_role=teacher_role,
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/bulk-accept/",
            {"application_ids": [str(application.id)]},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["accepted"] == 0
        assert len(response.data["skipped"]) == 1
        application.refresh_from_db()
        assert application.status == Application.Status.SUBMITTED


class TestBulkReject:
    def test_rejects_selected_applications(self, api_client):
        school, admin = _school_administrator()
        application = Application.objects.create(
            school=school, kind="student", first_name="A", last_name="B", email="a@b.test"
        )
        _login(api_client, admin)

        response = api_client.post(
            "/api/v1/admissions/applications/bulk-reject/",
            {"application_ids": [str(application.id)], "reason": "Class is full."},
            format="json",
        )

        assert response.status_code == 200
        application.refresh_from_db()
        assert application.status == Application.Status.REJECTED
        assert application.rejection_reason == "Class is full."
