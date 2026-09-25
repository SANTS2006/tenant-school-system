from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.authentication.serializers import SchoolSummarySerializer
from apps.authorization.permissions import require_permission
from apps.common.views import TenantScopedAPIView, TenantScopedModelViewSet
from apps.notifications.services import notify
from apps.students.models import Student
from apps.tenants.context import get_current_school_id
from apps.tenants.services import get_current_school

from . import services
from .models import Exam, ExamSchedule, GradeBoundary, GradingScale, Result
from .serializers import (
    BulkEnterResultSerializer,
    CorrectResultSerializer,
    ExamScheduleSerializer,
    ExamSerializer,
    GradeBoundarySerializer,
    GradingScaleSerializer,
    ResultSerializer,
)

_EXAM_ACTION_SUFFIX = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
}


def _ok(message="", **extra):
    return Response({"success": True, "message": message, "code": "OK", "errors": [], **extra})


class ExaminationsModelViewSet(TenantScopedModelViewSet):
    """Shared permission wiring for the examinations.* codes (exam/schedule config, not results)."""

    def get_permissions(self):
        code = f"examinations.{_EXAM_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]


class GradingScaleViewSet(ExaminationsModelViewSet):
    serializer_class = GradingScaleSerializer
    search_fields = ["name"]
    summary_stats = {
        "total": {},
        "default": {"is_default": True},
    }

    def get_queryset(self):
        return GradingScale.objects.all()


class GradeBoundaryViewSet(ExaminationsModelViewSet):
    serializer_class = GradeBoundarySerializer
    filterset_fields = ["grading_scale"]
    summary_stats = {
        "total": {},
    }

    def get_queryset(self):
        return GradeBoundary.objects.select_related("grading_scale").all()


class ExamViewSet(ExaminationsModelViewSet):
    serializer_class = ExamSerializer
    filterset_fields = ["term", "exam_type"]
    search_fields = ["name"]
    ordering_fields = ["start_date"]
    summary_stats = {
        "total": {},
        "by_exam_type": {"groupby": "exam_type"},
    }

    def get_queryset(self):
        return Exam.objects.select_related("term", "grading_scale").all()


class ExamScheduleViewSet(ExaminationsModelViewSet):
    serializer_class = ExamScheduleSerializer
    filterset_fields = ["exam", "school_class", "subject"]
    summary_stats = {
        "total": {},
    }

    def get_queryset(self):
        return ExamSchedule.objects.select_related("exam", "school_class", "subject").all()


_PAST_TENSE = {
    "submit": "submitted",
    "review": "reviewed",
    "approve": "approved",
    "publish": "published",
    "lock": "locked",
}

_RESULT_ACTION_PERMISSION = {
    "list": "results.view",
    "retrieve": "results.view",
    "create": "results.create",
    "update": "results.update",
    "partial_update": "results.update",
    "submit": "results.update",
    "review": "results.update",
    "approve": "results.approve",
    "publish": "results.publish",
    "lock": "results.lock",
    "correct": "results.lock",
    "bulk_enter": "results.create",
    "report_card": "results.view",
}


class ResultViewSet(TenantScopedModelViewSet):
    """
    Lifecycle: draft -> submitted -> reviewed -> approved -> published -> locked.
    Plain PATCH is blocked once approved (see ResultSerializer.validate()) — only
    the transition actions below, or `correct` once locked, can change a result
    from that point on. Never DELETE — a result is corrected, never removed.
    """

    serializer_class = ResultSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]
    filterset_fields = ["exam_schedule", "student", "status"]
    summary_stats = {
        "total": {},
        "by_status": {"groupby": "status"},
    }

    def get_permissions(self):
        code = _RESULT_ACTION_PERMISSION.get(self.action, "results.view")
        return [require_permission(code)()]

    def get_queryset(self):
        return Result.objects.select_related(
            "student", "exam_schedule__exam", "exam_schedule__subject"
        ).all()

    def perform_create(self, serializer):
        """See perform_update — same "recompute ca_score/score whenever exam_score is present"
        rule applies to a direct create, for the same reason (not used by the current frontend,
        which only ever creates results via bulk_enter, but the endpoint remains reachable)."""
        instance = serializer.save(school_id=get_current_school_id())
        if instance.exam_score is not None:
            instance.ca_score, instance.score = services.combine_score(
                exam_score=instance.exam_score, exam_schedule=instance.exam_schedule, student=instance.student
            )
            instance.save(update_fields=["ca_score", "score", "grade", "updated_at"])

    def perform_update(self, serializer):
        """A plain PATCH (e.g. ResultEditPage.tsx's single-result edit form, distinct from the
        bulk_enter flow) can still change exam_score — ResultSerializer.validate() already blocks
        this once the result is approved/published/locked, same as before this split. Whenever
        exam_score is part of the update, ca_score/score are recomputed here so they can never
        drift out of sync with it, the same combination services.enter_exam_score() uses."""
        instance = serializer.save()
        if "exam_score" in serializer.validated_data:
            instance.ca_score, instance.score = services.combine_score(
                exam_score=instance.exam_score, exam_schedule=instance.exam_schedule, student=instance.student
            )
            instance.save(update_fields=["ca_score", "score", "grade", "updated_at"])

    def _transition(self, pk, from_statuses, to_status, action_name):
        """
        Locks the result row for the duration of the check-then-write so two concurrent
        transition requests (e.g. a doubled-up click on "publish") can't both pass the same
        `from_statuses` check — the second blocks until the first commits, then sees the
        already-updated status and is correctly rejected as an invalid transition instead of
        silently double-transitioning (and, for `publish`, double-notifying the student). Same
        select_for_update()-then-recheck template as apps.events.views.EventViewSet.register.
        `unscoped_objects`: `self.get_object()` already established this result belongs to the
        right school, so re-fetching it by its own PK needs no fresh tenant-filtering decision.
        """
        obj = self.get_object()
        with transaction.atomic():
            result = Result.unscoped_objects.select_for_update().get(pk=obj.pk)
            if result.status not in from_statuses:
                return Response(
                    {
                        "success": False,
                        "message": f"Cannot {action_name} a result with status '{result.status}'.",
                        "code": "INVALID_TRANSITION",
                        "errors": [],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            before_status = result.status
            result.status = to_status
            update_fields = ["status"]
            if to_status == Result.Status.LOCKED:
                result.locked_at = timezone.now()
                update_fields.append("locked_at")
            result.save(update_fields=update_fields)
            log_action(
                action=f"results.{action_name}",
                actor=self.request.user,
                school=get_current_school(),
                entity_type="Result",
                entity_id=str(result.pk),
                before={"status": before_status},
                after={"status": to_status},
            )
        return _ok(f"Result {_PAST_TENSE[action_name]}.", result=ResultSerializer(result).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        return self._transition(pk, [Result.Status.DRAFT], Result.Status.SUBMITTED, "submit")

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        return self._transition(pk, [Result.Status.SUBMITTED], Result.Status.REVIEWED, "review")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._transition(pk, [Result.Status.REVIEWED], Result.Status.APPROVED, "approve")

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        response = self._transition(pk, [Result.Status.APPROVED], Result.Status.PUBLISHED, "publish")
        if response.status_code == status.HTTP_200_OK:
            result = Result.objects.select_related("student__user", "exam_schedule__subject").get(pk=pk)
            if result.student.user_id:
                notify(
                    recipient=result.student.user,
                    category="result",
                    title="A result was published",
                    message=f"Your {result.exam_schedule.subject.name} result is now on your transcript.",
                    link="/transcript",
                )
        return response

    @action(detail=True, methods=["post"])
    def lock(self, request, pk=None):
        return self._transition(pk, [Result.Status.PUBLISHED], Result.Status.LOCKED, "lock")

    @action(detail=True, methods=["post"])
    def correct(self, request, pk=None):
        """
        The only way to change a locked result. Requires a reason, always
        audited (severity=warning, before/after snapshot) — the result stays
        locked afterward rather than reopening the whole review pipeline,
        since a correction is a deliberate, authorized override, not a
        do-over of the approval process.
        """
        result = self.get_object()
        if result.status != Result.Status.LOCKED:
            return Response(
                {
                    "success": False,
                    "message": "Only a locked result can be corrected.",
                    "code": "INVALID_TRANSITION",
                    "errors": [],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = CorrectResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        before = {
            "exam_score": str(result.exam_score) if result.exam_score is not None else None,
            "ca_score": str(result.ca_score) if result.ca_score is not None else None,
            "score": str(result.score) if result.score is not None else None,
            "grade": result.grade,
            "teacher_comment": result.teacher_comment,
        }
        if "exam_score" in data:
            # Re-runs the same CA-lookup + combination enter_exam_score uses, but writes
            # directly rather than through that function's draft-only guard — `correct` is
            # already gated to LOCKED results above, which is exactly the authorized-override
            # case that guard exists to prevent everywhere else.
            result.exam_score = data["exam_score"]
            result.ca_score, result.score = services.combine_score(
                exam_score=data["exam_score"], exam_schedule=result.exam_schedule, student=result.student
            )
        elif "score" in data:
            result.score = data["score"]
        if "teacher_comment" in data:
            result.teacher_comment = data["teacher_comment"]
        result.save()  # recomputes grade
        after = {
            "exam_score": str(result.exam_score) if result.exam_score is not None else None,
            "ca_score": str(result.ca_score) if result.ca_score is not None else None,
            "score": str(result.score) if result.score is not None else None,
            "grade": result.grade,
            "teacher_comment": result.teacher_comment,
        }

        log_action(
            action="results.corrected",
            actor=request.user,
            school=get_current_school(),
            entity_type="Result",
            entity_id=str(result.pk),
            severity="warning",
            before=before,
            after=after,
            metadata={"reason": data["reason"]},
        )
        return _ok("Result corrected.", result=ResultSerializer(result).data)

    @action(detail=False, methods=["post"], url_path="bulk-enter")
    def bulk_enter(self, request):
        """
        Enters/updates scores for a whole class's sitting of one exam
        schedule in a single call. Only touches results still in `draft` (or
        not yet created) — a result already submitted/reviewed/approved/
        published/locked is left untouched and reported back in `skipped`,
        so this can never be used to bypass the review pipeline.
        """
        serializer = BulkEnterResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        school = get_current_school()

        exam_schedule = get_object_or_404(ExamSchedule, pk=data["exam_schedule"], school=school)

        results = []
        skipped = []
        with transaction.atomic():
            for entry in data["entries"]:
                student = get_object_or_404(Student, pk=entry["student_id"], school=school)
                existing = Result.objects.filter(exam_schedule=exam_schedule, student=student).first()
                if existing is not None and existing.status != Result.Status.DRAFT:
                    skipped.append({"student_id": str(student.id), "status": existing.status})
                    continue
                result = services.enter_exam_score(
                    exam_schedule=exam_schedule,
                    student=student,
                    exam_score=entry.get("exam_score"),
                    teacher_comment=entry.get("teacher_comment", ""),
                )
                results.append(result)

        return _ok(
            f"Entered results for {len(results)} student(s).",
            results=ResultSerializer(results, many=True).data,
            skipped=skipped,
        )

    @action(detail=False, methods=["get"], url_path="report-card")
    def report_card(self, request):
        """
        Only published/locked results count toward a report card — a draft
        or in-review mark isn't final and shouldn't appear on one.
        """
        student_id = request.query_params.get("student")
        if not student_id:
            return Response(
                {
                    "success": False,
                    "message": "The 'student' query parameter is required.",
                    "code": "VALIDATION_ERROR",
                    "errors": [],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        student = get_object_or_404(Student, pk=student_id, school=get_current_school())

        qs = Result.objects.filter(
            student=student, status__in=[Result.Status.PUBLISHED, Result.Status.LOCKED]
        ).select_related("exam_schedule__exam", "exam_schedule__subject")

        term_id = request.query_params.get("term")
        if term_id:
            qs = qs.filter(exam_schedule__exam__term_id=term_id)

        rows = [
            {
                "subject": r.exam_schedule.subject.name,
                "exam": r.exam_schedule.exam.name,
                "ca_score": r.ca_score,
                "exam_score": r.exam_score,
                "score": r.score,
                "max_score": r.exam_schedule.max_score,
                "grade": r.grade,
                "teacher_comment": r.teacher_comment,
            }
            for r in qs
        ]
        scores = [float(r.score) for r in qs if r.score is not None]
        average = round(sum(scores) / len(scores), 2) if scores else None

        return _ok(
            student={"id": str(student.id), "name": student.full_name},
            results=rows,
            average=average,
        )


class MyTranscriptView(TenantScopedAPIView):
    """
    Student self-service: this student's own transcript. No permission gate — same
    identity-keyed pattern as MyAssignmentsView — only published/locked results count (a
    draft/in-review mark isn't final), grouped by term, with the school's own name/logo embedded
    so the rendered page is visibly that school's transcript.
    """

    def get(self, request):
        student_profile = getattr(request.user, "student_profile", None)
        school = get_current_school()
        school_data = SchoolSummarySerializer(school).data if school else None
        if student_profile is None:
            return _ok(school=school_data, student=None, terms=[])

        qs = Result.objects.filter(
            student=student_profile, status__in=[Result.Status.PUBLISHED, Result.Status.LOCKED]
        ).select_related("exam_schedule__exam__term", "exam_schedule__subject")

        terms: dict[str, dict] = {}
        for r in qs:
            term = r.exam_schedule.exam.term
            bucket = terms.setdefault(
                str(term.id), {"id": str(term.id), "name": term.name, "results": []}
            )
            bucket["results"].append(
                {
                    "subject": r.exam_schedule.subject.name,
                    "exam": r.exam_schedule.exam.name,
                    "ca_score": r.ca_score,
                    "exam_score": r.exam_score,
                    "score": r.score,
                    "max_score": r.exam_schedule.max_score,
                    "grade": r.grade,
                    "teacher_comment": r.teacher_comment,
                }
            )

        return _ok(
            school=school_data,
            student={"id": str(student_profile.id), "name": student_profile.full_name},
            terms=list(terms.values()),
        )
