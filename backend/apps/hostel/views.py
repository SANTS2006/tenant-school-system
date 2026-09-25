from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.authorization.permissions import require_permission
from apps.common.views import TenantScopedModelViewSet

from . import services
from .models import Bed, Hostel, HostelAllocation, Room
from .serializers import BedSerializer, HostelAllocationSerializer, HostelSerializer, RoomSerializer

_ACTION_SUFFIX = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
    "check_out": "update",
}


def _ok(message="", **extra):
    return Response({"success": True, "message": message, "code": "OK", "errors": [], **extra})


class HostelModelViewSet(TenantScopedModelViewSet):
    """Shared permission wiring for the hostel.* codes across every hostel resource."""

    def get_permissions(self):
        code = f"hostel.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]


class HostelViewSet(HostelModelViewSet):
    serializer_class = HostelSerializer
    search_fields = ["name"]
    summary_stats = {
        "total": {},
        "by_gender_restriction": {"groupby": "gender_restriction"},
    }

    def get_queryset(self):
        return Hostel.objects.select_related("warden__user").all()


class RoomViewSet(HostelModelViewSet):
    serializer_class = RoomSerializer
    filterset_fields = ["hostel"]
    summary_stats = {
        "total": {},
    }

    def get_queryset(self):
        return Room.objects.select_related("hostel").all()


class BedViewSet(HostelModelViewSet):
    serializer_class = BedSerializer
    filterset_fields = ["room"]
    summary_stats = {
        "total": {},
        "occupied": {"allocations__status": HostelAllocation.Status.ACTIVE},
    }

    def get_queryset(self):
        return Bed.objects.select_related("room__hostel").all()


class HostelAllocationViewSet(TenantScopedModelViewSet):
    """
    `create()` is `allocate_bed()` — locks the bed row so two simultaneous
    allocation requests for the same bed can't both succeed (the spec's own
    "prevent over-allocation" example). `DELETE` is disabled; an allocation
    is checked out, never removed.
    """

    serializer_class = HostelAllocationSerializer
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ["bed", "student", "status"]
    summary_stats = {
        "total": {},
        "active": {"status": HostelAllocation.Status.ACTIVE},
        "checked_out": {"status": HostelAllocation.Status.CHECKED_OUT},
        "by_status": {"groupby": "status"},
    }

    def get_permissions(self):
        code = f"hostel.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]

    def get_queryset(self):
        return HostelAllocation.objects.select_related("student", "bed__room__hostel").all()

    def create(self, request, *args, **kwargs):
        serializer = HostelAllocationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            allocation = services.allocate_bed(
                bed=data["bed"], student=data["student"], check_in_date=data.get("check_in_date")
            )
        except services.HostelError as exc:
            return Response(
                {"success": False, "message": str(exc), "code": "VALIDATION_ERROR", "errors": []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": "Bed allocated.",
                "code": "OK",
                "errors": [],
                "allocation": HostelAllocationSerializer(allocation).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="check-out")
    def check_out(self, request, pk=None):
        allocation = self.get_object()
        try:
            allocation = services.check_out(allocation=allocation)
        except services.HostelError as exc:
            return Response(
                {"success": False, "message": str(exc), "code": "VALIDATION_ERROR", "errors": []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return _ok("Student checked out.", allocation=HostelAllocationSerializer(allocation).data)
