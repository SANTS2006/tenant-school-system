from apps.common.views import TenantScopedReadOnlyViewSet

from .models import Role
from .permissions import require_permission
from .serializers import RoleSerializer


class RoleViewSet(TenantScopedReadOnlyViewSet):
    """
    Read-only: roles are seeded per-school (see seed_default_roles_for_school)
    rather than freely created via the API in this phase. `Role.objects` is
    the tenant-scoped manager, so this naturally lists only the requesting
    user's own school's roles.
    """

    serializer_class = RoleSerializer
    permission_classes = [require_permission("users.view")]

    def get_queryset(self):
        return Role.objects.filter(is_active=True).order_by("name")
