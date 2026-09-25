from rest_framework import serializers

from .models import Staff


class StaffSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    photo = serializers.FileField(use_url=True, read_only=True)
    is_online = serializers.BooleanField(source="user.is_online", read_only=True)
    # Write-only counterpart of `photo` above — `Staff.photo` is a read-only Python property
    # delegating to `user.photo`, so a plain `ModelSerializer.update()` can't assign through it;
    # `save()` below pops this and writes it onto the linked `User` explicitly instead.
    photo_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)

    class Meta:
        model = Staff
        fields = [
            "id", "user", "full_name", "email", "photo", "photo_upload", "is_online", "staff_id",
            "department", "department_name", "job_title", "qualification", "hire_date",
            "employment_status", "emergency_contact_name", "emergency_contact_phone",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "employment_status", "created_at", "updated_at"]

    def validate_user(self, value):
        request = self.context["request"]
        if value.school_id != request.user.school_id:
            raise serializers.ValidationError("User must belong to your own school.")
        if hasattr(value, "staff_profile"):
            raise serializers.ValidationError("This user already has a staff profile.")
        return value

    def validate_department(self, value):
        request = self.context["request"]
        if value is not None and value.school_id != request.user.school_id:
            raise serializers.ValidationError("Department must belong to your own school.")
        return value

    def save(self, **kwargs):
        photo = self.validated_data.pop("photo_upload", None)
        instance = super().save(**kwargs)
        if photo is not None:
            instance.user.photo = photo
            instance.user.save(update_fields=["photo"])
        return instance
