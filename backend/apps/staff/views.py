from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.authorization.permissions import require_permission
from apps.common.views import TenantScopedModelViewSet
from apps.tenants.services import get_current_school

from .models import Staff
from .serializers import StaffSerializer

_ACTION_SUFFIX = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
    "enable": "update",
}


def _ok(message="", **extra):
    return Response({"success": True, "message": message, "code": "OK", "errors": [], **extra})


class StaffViewSet(TenantScopedModelViewSet):
    """
    `DELETE` never removes a staff row — it marks employment_status=terminated
    (perform_destroy override), matching "prefer archive/deactivate" for
    sensitive records. Use `enable` to reactivate.
    """

    serializer_class = StaffSerializer
    filterset_fields = ["department", "employment_status"]
    search_fields = ["user__first_name", "user__last_name", "user__email", "staff_id"]
    ordering_fields = ["user__first_name", "hire_date"]
    summary_stats = {
        "total": {},
        "active": {"employment_status": Staff.EmploymentStatus.ACTIVE},
        "by_status": {"groupby": "employment_status"},
    }

    def get_permissions(self):
        if self.action == "reset_password":
            return [require_permission("users.reset_password")()]
        code = f"staff.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]

    def get_queryset(self):
        # A method, not a class-level `queryset =` attribute — see the note
        # on apps.academics.views.AcademicsModelViewSet for why that matters
        # for a TenantScopedModel.
        return Staff.objects.select_related("user", "department").all()

    def perform_destroy(self, instance):
        instance.employment_status = Staff.EmploymentStatus.TERMINATED
        instance.save(update_fields=["employment_status"])
        log_action(
            action="staff.terminated",
            actor=self.request.user,
            school=get_current_school(),
            entity_type="Staff",
            entity_id=str(instance.pk),
            severity="warning",
        )

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """Resets the linked account's password back to the school's default (see
        `apps.tenants.services.generate_default_password`) — the same deterministic value every
        school-scoped user is provisioned with, not a random one-off, since there's no email/
        reset-link flow for these accounts to fall back on if a random password were used."""
        from apps.tenants.services import generate_default_password

        staff = self.get_object()
        default_password = generate_default_password(staff.school)
        staff.user.set_password(default_password)
        staff.user.must_change_password = True
        staff.user.save(update_fields=["password", "must_change_password"])
        log_action(
            action="users.password_reset_to_default",
            actor=request.user,
            school=get_current_school(),
            entity_type="User",
            entity_id=str(staff.user_id),
            severity="warning",
        )
        return _ok("Password reset to the school default.", default_password=default_password)

    @action(detail=True, methods=["post"])
    def enable(self, request, pk=None):
        staff = self.get_object()
        staff.employment_status = Staff.EmploymentStatus.ACTIVE
        staff.save(update_fields=["employment_status"])
        log_action(
            action="staff.reactivated",
            actor=request.user,
            school=get_current_school(),
            entity_type="Staff",
            entity_id=str(staff.pk),
        )
        return _ok("Staff reactivated.", staff=StaffSerializer(staff).data)
