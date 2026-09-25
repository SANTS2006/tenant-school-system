from django.db.models import Count
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.authorization.permissions import IsPlatformAdmin
from apps.common.views import TenantScopedAPIView, TenantScopedModelViewSet
from apps.tenants.models import School
from apps.users.models import User
from apps.users.services import invite_user

from .serializers import InvitePlatformAdminSerializer, PlatformAdminSerializer


def _ok(message="", **extra):
    return Response({"success": True, "message": message, "code": "OK", "errors": [], **extra})


class PlatformAdminViewSet(TenantScopedModelViewSet):
    """Manage platform-administrator accounts. Platform-admin-only, obviously."""

    permission_classes = [IsPlatformAdmin]
    serializer_class = PlatformAdminSerializer
    http_method_names = ["get", "post", "head", "options"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["created_at", "email"]
    summary_stats = {
        "total": {},
        "active": {"is_active": True},
    }

    def get_queryset(self):
        return User.objects.filter(user_type=User.UserType.PLATFORM_ADMIN).order_by("email")

    def create(self, request, *args, **kwargs):
        return Response(
            {
                "success": False,
                "message": "Platform admins cannot be created directly. Use the 'invite' action.",
                "code": "METHOD_NOT_ALLOWED",
                "errors": [],
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=["post"])
    def invite(self, request):
        serializer = InvitePlatformAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        admin = invite_user(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            school=None,
            user_type=User.UserType.PLATFORM_ADMIN,
            invited_by=request.user,
        )
        return _ok("Invitation sent.", admin=PlatformAdminSerializer(admin).data)

    @action(detail=True, methods=["post"])
    def disable(self, request, pk=None):
        admin = self.get_object()
        if admin.pk == request.user.pk:
            return Response(
                {
                    "success": False,
                    "message": "You cannot disable your own account.",
                    "code": "SELF_DISABLE_FORBIDDEN",
                    "errors": [],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        admin.is_active = False
        admin.save(update_fields=["is_active"])
        log_action(
            action="platform.admin_disabled",
            actor=request.user,
            entity_type="User",
            entity_id=str(admin.pk),
            severity="warning",
        )
        return _ok("Platform admin disabled.", admin=PlatformAdminSerializer(admin).data)

    @action(detail=True, methods=["post"])
    def enable(self, request, pk=None):
        admin = self.get_object()
        admin.is_active = True
        admin.save(update_fields=["is_active"])
        log_action(
            action="platform.admin_enabled",
            actor=request.user,
            entity_type="User",
            entity_id=str(admin.pk),
        )
        return _ok("Platform admin enabled.", admin=PlatformAdminSerializer(admin).data)


class PlatformStatsView(TenantScopedAPIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        status_counts = {
            row["status"]: row["count"]
            for row in School.objects.values("status").annotate(count=Count("id"))
        }
        return _ok(
            stats={
                "schools_total": School.objects.count(),
                "schools_by_status": {
                    choice_value: status_counts.get(choice_value, 0)
                    for choice_value, _ in School.Status.choices
                },
                "school_users_total": User.objects.filter(
                    user_type=User.UserType.SCHOOL_USER
                ).count(),
                "platform_admins_total": User.objects.filter(
                    user_type=User.UserType.PLATFORM_ADMIN
                ).count(),
            }
        )
