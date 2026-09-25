from rest_framework import serializers

from .models import Exam, ExamSchedule, GradeBoundary, GradingScale, Result


class GradingScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScale
        fields = ["id", "name", "is_default", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GradeBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeBoundary
        fields = ["id", "grading_scale", "grade", "min_score", "max_score", "gpa_value"]
        read_only_fields = ["id"]

    def validate_grading_scale(self, value):
        request = self.context["request"]
        if value.school_id != request.user.school_id:
            raise serializers.ValidationError("Grading scale must belong to your own school.")
        return value

    def validate(self, attrs):
        min_score = attrs.get("min_score", getattr(self.instance, "min_score", None))
        max_score = attrs.get("max_score", getattr(self.instance, "max_score", None))
        if min_score is not None and max_score is not None and max_score <= min_score:
            raise serializers.ValidationError({"max_score": "Must be greater than min_score."})
        return attrs


class ExamSerializer(serializers.ModelSerializer):
    term_name = serializers.CharField(source="term.name", read_only=True)
    grading_scale_name = serializers.CharField(source="grading_scale.name", read_only=True, default=None)

    class Meta:
        model = Exam
        fields = [
            "id", "name", "exam_type", "term", "term_name", "grading_scale", "grading_scale_name",
            "start_date", "end_date", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _same_school(self, value, label):
        request = self.context["request"]
        if value is not None and value.school_id != request.user.school_id:
            raise serializers.ValidationError(f"{label} must belong to your own school.")
        return value

    def validate_term(self, value):
        return self._same_school(value, "Term")

    def validate_grading_scale(self, value):
        return self._same_school(value, "Grading scale")


class ExamScheduleSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = ExamSchedule
        fields = [
            "id", "exam", "exam_name", "school_class", "school_class_name", "subject", "subject_name",
            "max_score", "date", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _same_school(self, value, label):
        request = self.context["request"]
        if value is not None and value.school_id != request.user.school_id:
            raise serializers.ValidationError(f"{label} must belong to your own school.")
        return value

    def validate_exam(self, value):
        return self._same_school(value, "Exam")

    def validate_school_class(self, value):
        return self._same_school(value, "Class")

    def validate_subject(self, value):
        return self._same_school(value, "Subject")


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    exam_schedule_label = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            "id", "exam_schedule", "exam_schedule_label", "student", "student_name",
            "exam_score", "ca_score", "score", "grade", "teacher_comment", "status", "locked_at",
            "created_at", "updated_at",
        ]
        # ca_score/score are read-only — both are always derived, never set directly. exam_score
        # stays writable (a single-result edit, e.g. ResultEditPage.tsx, is a real UI path
        # alongside bulk_enter) — ResultViewSet.perform_update() recomputes ca_score/score via
        # services.combine_score() whenever exam_score changes, so this can never desync from a
        # plain PATCH the way a naive read-only split would.
        read_only_fields = ["id", "ca_score", "score", "grade", "status", "locked_at", "created_at", "updated_at"]

    def get_exam_schedule_label(self, obj):
        return str(obj.exam_schedule) if obj.exam_schedule_id else None

    def _same_school(self, value, label):
        request = self.context["request"]
        if value is not None and value.school_id != request.user.school_id:
            raise serializers.ValidationError(f"{label} must belong to your own school.")
        return value

    def validate_exam_schedule(self, value):
        return self._same_school(value, "Exam schedule")

    def validate_student(self, value):
        return self._same_school(value, "Student")

    def validate(self, attrs):
        """Score/comment are only editable before the result is approved — see ResultViewSet."""
        if self.instance is not None and self.instance.status in (
            Result.Status.APPROVED,
            Result.Status.PUBLISHED,
            Result.Status.LOCKED,
        ):
            raise serializers.ValidationError(
                f"Cannot edit a result once it is {self.instance.status}. "
                "Use the appropriate workflow action instead."
            )
        return attrs


class BulkEnterResultEntrySerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    # The exam-portion score only, out of the exam_schedule's own max_score — NOT the final
    # combined score. See apps.examinations.services.enter_exam_score, which computes the CA
    # component and combines the two into Result.score.
    exam_score = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True, required=False)
    teacher_comment = serializers.CharField(required=False, allow_blank=True, default="")


class BulkEnterResultSerializer(serializers.Serializer):
    exam_schedule = serializers.UUIDField()
    entries = BulkEnterResultEntrySerializer(many=True)


class CorrectResultSerializer(serializers.Serializer):
    # Two mutually-exclusive ways to correct a locked result: `score` sets the final score
    # directly (for a plain manual override, e.g. correcting a pre-CA-split legacy result), while
    # `exam_score` re-runs the same CA-lookup + combination `enter_exam_score` uses (for
    # correcting the exam-portion input on a subject that does have CA data) — see
    # ResultViewSet.correct.
    score = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)
    exam_score = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)
    teacher_comment = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(max_length=500)
