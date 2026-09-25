import pytest

from apps.authorization.models import Role
from apps.authorization.services import assign_role, seed_default_roles_for_school, seed_permission_catalog
from tests.factories import (
    DEFAULT_TEST_PASSWORD,
    ExamFactory,
    ExamScheduleFactory,
    GradeBoundaryFactory,
    GradingScaleFactory,
    ResultFactory,
    SchoolFactory,
    StudentFactory,
    UserFactory,
)

from .models import Result

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


def _teacher(school):
    teacher = UserFactory(school=school)
    assign_role(user=teacher, role=Role.unscoped_objects.get(school=school, slug="teacher"))
    return teacher


class TestExamConfig:
    def test_principal_can_create_exam_and_schedule(self, api_client):
        school, principal = _principal()
        term_id = ExamFactory(school=school).term_id
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/examinations/exams/",
            {"name": "Midterm", "term": str(term_id), "start_date": "2026-02-01", "end_date": "2026-02-05"},
            format="json",
        )
        assert response.status_code == 201

    def test_teacher_cannot_create_exam(self, api_client):
        school, _ = _principal()
        teacher = _teacher(school)
        term_id = ExamFactory(school=school).term_id
        _login(api_client, teacher)

        response = api_client.post(
            "/api/v1/examinations/exams/",
            {"name": "Midterm", "term": str(term_id), "start_date": "2026-02-01", "end_date": "2026-02-05"},
            format="json",
        )
        assert response.status_code == 403

    def test_duplicate_exam_name_in_term_rejected(self, api_client):
        school, principal = _principal()
        exam = ExamFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/examinations/exams/",
            {
                "name": exam.name,
                "term": str(exam.term_id),
                "start_date": "2026-02-01",
                "end_date": "2026-02-05",
            },
            format="json",
        )
        assert response.status_code == 400


class TestGradeComputation:
    def test_score_computes_grade_from_boundary(self, api_client):
        school, principal = _principal()
        scale = GradingScaleFactory(school=school)
        GradeBoundaryFactory(school=school, grading_scale=scale, grade="A", min_score=80, max_score=100)
        GradeBoundaryFactory(school=school, grading_scale=scale, grade="B", min_score=60, max_score=79.99)
        exam = ExamFactory(school=school, grading_scale=scale)
        exam_schedule = ExamScheduleFactory(school=school, exam=exam)
        student = StudentFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/results/",
            {"exam_schedule": str(exam_schedule.id), "student": str(student.id), "score": "72.50"},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["grade"] == "B"


class TestResultLifecycle:
    def test_full_transition_sequence(self, api_client):
        school, principal = _principal()
        result = ResultFactory(school=school)
        _login(api_client, principal)
        base = f"/api/v1/results/{result.id}"

        assert api_client.post(f"{base}/submit/").status_code == 200
        assert api_client.post(f"{base}/review/").status_code == 200
        assert api_client.post(f"{base}/approve/").status_code == 200
        assert api_client.post(f"{base}/publish/").status_code == 200
        assert api_client.post(f"{base}/lock/").status_code == 200

        result.refresh_from_db()
        assert result.status == Result.Status.LOCKED
        assert result.locked_at is not None

    def test_cannot_skip_a_transition(self, api_client):
        school, principal = _principal()
        result = ResultFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(f"/api/v1/results/{result.id}/approve/")
        assert response.status_code == 400
        assert response.data["code"] == "INVALID_TRANSITION"

    def test_cannot_edit_once_approved(self, api_client):
        school, principal = _principal()
        result = ResultFactory(school=school)
        _login(api_client, principal)
        base = f"/api/v1/results/{result.id}"
        api_client.post(f"{base}/submit/")
        api_client.post(f"{base}/review/")
        api_client.post(f"{base}/approve/")

        response = api_client.patch(f"{base}/", {"score": "99"}, format="json")
        assert response.status_code == 400

    def test_can_edit_while_draft(self, api_client):
        school, principal = _principal()
        result = ResultFactory(school=school, score=50)
        _login(api_client, principal)

        response = api_client.patch(f"/api/v1/results/{result.id}/", {"score": "60"}, format="json")
        assert response.status_code == 200
        assert response.data["score"] == "60.00"

    def test_correct_requires_locked_status(self, api_client):
        school, principal = _principal()
        result = ResultFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(
            f"/api/v1/results/{result.id}/correct/", {"reason": "typo"}, format="json"
        )
        assert response.status_code == 400

    def test_correct_a_locked_result(self, api_client):
        school, principal = _principal()
        result = ResultFactory(school=school, score=70)
        _login(api_client, principal)
        base = f"/api/v1/results/{result.id}"
        for action in ("submit", "review", "approve", "publish", "lock"):
            api_client.post(f"{base}/{action}/")

        response = api_client.post(
            f"{base}/correct/",
            {"score": "75", "reason": "Recount requested by parent"},
            format="json",
        )
        assert response.status_code == 200
        result.refresh_from_db()
        assert result.status == Result.Status.LOCKED  # stays locked
        assert str(result.score) == "75.00"


class TestBulkEnter:
    def test_bulk_enter_creates_results(self, api_client):
        school, principal = _principal()
        exam_schedule = ExamScheduleFactory(school=school)
        s1 = StudentFactory(school=school)
        s2 = StudentFactory(school=school)
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/results/bulk-enter/",
            {
                "exam_schedule": str(exam_schedule.id),
                "entries": [
                    {"student_id": str(s1.id), "score": "88"},
                    {"student_id": str(s2.id), "score": "45"},
                ],
            },
            format="json",
        )
        assert response.status_code == 200
        assert len(response.data["results"]) == 2

    def test_bulk_enter_skips_non_draft_results(self, api_client):
        school, principal = _principal()
        exam_schedule = ExamScheduleFactory(school=school)
        student = StudentFactory(school=school)
        result = ResultFactory(school=school, exam_schedule=exam_schedule, student=student, score=40)
        _login(api_client, principal)
        api_client.post(f"/api/v1/results/{result.id}/submit/")

        response = api_client.post(
            "/api/v1/results/bulk-enter/",
            {"exam_schedule": str(exam_schedule.id), "entries": [{"student_id": str(student.id), "score": "99"}]},
            format="json",
        )
        assert response.status_code == 200
        assert len(response.data["results"]) == 0
        assert len(response.data["skipped"]) == 1
        result.refresh_from_db()
        assert result.score == 40  # untouched


class TestReportCard:
    def test_only_published_results_appear(self, api_client):
        school, principal = _principal()
        student = StudentFactory(school=school)
        draft_result = ResultFactory(school=school, student=student, score=30)
        published_result = ResultFactory(school=school, student=student, score=90)
        _login(api_client, principal)
        base = f"/api/v1/results/{published_result.id}"
        for action in ("submit", "review", "approve", "publish"):
            api_client.post(f"{base}/{action}/")

        response = api_client.get(f"/api/v1/results/report-card/?student={student.id}")
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["average"] == 90.0


class TestExaminationsTenantIsolation:
    def test_cannot_list_another_schools_exams(self, api_client):
        school_a, principal_a = _principal()
        school_b, _ = _principal()
        ExamFactory(school=school_b)
        exam_a = ExamFactory(school=school_a)

        _login(api_client, principal_a)
        response = api_client.get("/api/v1/examinations/exams/")

        assert response.status_code == 200
        ids_seen = {row["id"] for row in response.data["results"]}
        assert str(exam_a.id) in ids_seen
        assert len(ids_seen) == 1

    def test_cannot_retrieve_another_schools_result(self, api_client):
        school_a, principal_a = _principal()
        school_b, _ = _principal()
        result_b = ResultFactory(school=school_b)

        _login(api_client, principal_a)
        response = api_client.get(f"/api/v1/results/{result_b.id}/")
        assert response.status_code == 404
