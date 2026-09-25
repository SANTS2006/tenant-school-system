from rest_framework import serializers

from .models import Announcement, AnnouncementRecipient


class AnnouncementSerializer(serializers.ModelSerializer):
    target_class_name = serializers.CharField(source="target_class.name", read_only=True, default=None)
    target_section_name = serializers.SerializerMethodField()
    target_department_name = serializers.CharField(source="target_department.name", read_only=True, default=None)
    published_by_name = serializers.CharField(source="published_by.full_name", read_only=True, default=None)

    class Meta:
        model = Announcement
        fields = [
            "id", "title", "body", "target_type", "target_class", "target_class_name",
            "target_section", "target_section_name", "target_department", "target_department_name",
            "send_email", "published_by", "published_by_name", "published_at", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "published_by", "published_at", "created_at", "updated_at"]

    def get_target_section_name(self, obj):
        return str(obj.target_section) if obj.target_section_id else None

    def _same_school(self, value, label):
        request = self.context["request"]
        if value is not None and value.school_id != request.user.school_id:
            raise serializers.ValidationError(f"{label} must belong to your own school.")
        return value

    def validate_target_class(self, value):
        return self._same_school(value, "Class")

    def validate_target_section(self, value):
        return self._same_school(value, "Section")

    def validate_target_department(self, value):
        return self._same_school(value, "Department")


class AnnouncementRecipientSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = AnnouncementRecipient
        fields = ["id", "announcement", "user", "user_name"]
        read_only_fields = ["id"]

    def _same_school(self, value, label):
        request = self.context["request"]
        if value.school_id != request.user.school_id:
            raise serializers.ValidationError(f"{label} must belong to your own school.")
        return value

    def validate_announcement(self, value):
        return self._same_school(value, "Announcement")

    def validate_user(self, value):
        return self._same_school(value, "User")
