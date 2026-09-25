from rest_framework import serializers

from .models import DisciplineIncident


class DisciplineIncidentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.full_name", read_only=True, default=None)

    class Meta:
        model = DisciplineIncident
        fields = [
            "id", "student", "student_name", "category", "severity", "incident_date", "description",
            "reported_by", "reported_by_name", "action_taken", "status", "parent_notified",
            "follow_up_notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "reported_by", "created_at", "updated_at"]

    def validate_student(self, value):
        request = self.context["request"]
        if value.school_id != request.user.school_id:
            raise serializers.ValidationError("Student must belong to your own school.")
        return value
