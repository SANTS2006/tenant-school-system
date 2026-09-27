from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.common.views import TenantScopedModelViewSet
from apps.tenants.services import get_current_school

from .models import Permission, Role, RolePermission
from .permissions import require_permission
from .serializers import PermissionSerializer, RoleSerializer

_ACTION_SUFFIX = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
    "permissions": "view",
    "set_permissions": "update",
}


def _ok(message="", **extra):
    return Response({"success": True, "message": message, "code": "OK", "errors": [], **extra})


def _error(message, code, http_status):
    from rest_framework import status as drf_status

    return Response(
        {"success": False, "message": message, "code": code, "errors": [message]},
        status=http_status or drf_status.HTTP_400_BAD_REQUEST,
    )


class RoleViewSet(TenantScopedModelViewSet):
    """
    Roles are seeded per-school for the standard system roles (see
    seed_default_roles_for_school) but can also be created freely here for a school's own custom
    roles. A system role can never be renamed away from its seeded identity or deleted (its slug
    is load-bearing — several features key scoping off e.g. `role__slug="teacher"`), but ANY
    role's permission set — system or custom — can be edited via the `permissions` action; doing
    so flips `is_system` off so a later `resync_role_permissions` run (see deploy/start.sh, which
    runs it on every deploy) never overwrites an admin's own customization.
    """

    serializer_class = RoleSerializer
    search_fields = ["name", "slug"]
    ordering_fields = ["name"]
    summary_stats = {
        "total": {},
        "system": {"is_system": True},
    }

    def get_permissions(self):
        code = f"roles.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]

    def get_queryset(self):
        return Role.objects.filter(is_active=True).prefetch_related("permissions").order_by("name")

    def perform_update(self, serializer):
        if serializer.instance.is_system and "name" in serializer.validated_data:
            from rest_framework.exceptions import ValidationError

            raise ValidationError("A system role's name can't be changed.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("A system role can't be deleted.")
        instance.delete()

    @action(detail=True, methods=["get"])
    def permissions(self, request, pk=None):
        """Every permission in the catalog, each flagged with whether this role currently grants
        it — the shape a multi-select assignment UI needs in one call."""
        role = self.get_object()
        granted_ids = set(role.permissions.values_list("id", flat=True))
        all_permissions = Permission.objects.all().order_by("module", "code")
        data = [
            {**PermissionSerializer(p).data, "granted": p.id in granted_ids} for p in all_permissions
        ]
        return _ok(permissions=data)

    @action(detail=True, methods=["post"], url_path="set-permissions")
    def set_permissions(self, request, pk=None):
        """Replaces this role's entire permission set with the given list of permission ids —
        the multi-select "these, and only these" assignment the Roles admin page uses, rather
        than incremental add/remove calls."""
        role = self.get_object()
        permission_ids = request.data.get("permission_ids")
        if not isinstance(permission_ids, list):
            return _error("permission_ids must be a list.", "VALIDATION_ERROR", 400)

        permissions = list(Permission.objects.filter(id__in=permission_ids))
        school = get_current_school()
        RolePermission.unscoped_objects.filter(role=role).delete()
        RolePermission.unscoped_objects.bulk_create(
            [RolePermission(school=school, role=role, permission=p) for p in permissions]
        )
        if role.is_system:
            role.is_system = False
            role.save(update_fields=["is_system"])

        log_action(
            action="roles.permissions_updated",
            actor=request.user,
            school=school,
            entity_type="Role",
            entity_id=str(role.pk),
            after={"permission_codes": sorted(p.code for p in permissions)},
        )
        return _ok("Permissions updated.", role=RoleSerializer(role).data)


class PermissionViewSet(TenantScopedModelViewSet):
    """The global permission catalog (not tenant-scoped — see the Permission model). Most
    permissions come from `apps.authorization.catalog` and are recreated by `seed_permissions` on
    every deploy, so editing/deleting one of those has no lasting effect; this is really for a
    school's own custom permission codes, which only ever do something once a school-specific
    workflow is built to check them (a permission with no code checking it is inert)."""

    serializer_class = PermissionSerializer
    search_fields = ["code", "name", "module"]
    ordering_fields = ["module", "code"]
    summary_stats = {
        "total": {},
        "by_module": {"groupby": "module"},
    }

    def get_permissions(self):
        code = f"permissions.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]

    def get_queryset(self):
        return Permission.objects.all()

    def perform_create(self, serializer):
        serializer.save()
