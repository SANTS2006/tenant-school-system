from rest_framework.decorators import action
from rest_framework.response import Response

from apps.authorization.permissions import require_permission
from apps.common.views import TenantScopedModelViewSet
from apps.tenants.services import get_current_school

from . import services
from .models import Announcement, AnnouncementRecipient
from .serializers import AnnouncementRecipientSerializer, AnnouncementSerializer

_ACTION_SUFFIX = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
    "publish": "create",
}


def _ok(message="", **extra):
    return Response({"success": True, "message": message, "code": "OK", "errors": [], **extra})


class AnnouncementViewSet(TenantScopedModelViewSet):
    serializer_class = AnnouncementSerializer
    filterset_fields = ["target_type", "is_active"]
    search_fields = ["title", "body"]
    summary_stats = {
        "total": {},
        "active": {"is_active": True},
        "by_target_type": {"groupby": "target_type"},
    }

    def get_permissions(self):
        code = f"communications.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]

    def get_queryset(self):
        return Announcement.objects.select_related("target_class", "target_section", "target_department").all()

    def perform_create(self, serializer):
        serializer.save(school=get_current_school(), published_by=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Resolves the tenant-scoped audience and creates in-app (+ optional email) notifications."""
        announcement = self.get_object()
        recipient_count = services.publish_announcement(announcement)
        return _ok(
            f"Published to {recipient_count} recipient(s).",
            announcement=AnnouncementSerializer(announcement).data,
        )


class AnnouncementRecipientViewSet(TenantScopedModelViewSet):
    """Manages the explicit recipient list for announcements with target_type=specific_users."""

    serializer_class = AnnouncementRecipientSerializer
    filterset_fields = ["announcement"]
    summary_stats = {"total": {}}

    def get_permissions(self):
        code = f"communications.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]

    def get_queryset(self):
        return AnnouncementRecipient.objects.select_related("announcement", "user").all()
