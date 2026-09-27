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

