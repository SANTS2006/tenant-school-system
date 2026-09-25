from rest_framework import serializers

from .models import Role


class RoleSerializer(serializers.ModelSerializer):
    permission_codes = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ["id", "name", "slug", "description", "is_system", "is_active", "permission_codes"]

    def get_permission_codes(self, role):
        return sorted(role.permissions.values_list("code", flat=True))
