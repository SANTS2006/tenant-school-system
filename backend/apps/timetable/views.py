from rest_framework.decorators import action
from rest_framework.response import Response

from apps.authorization.permissions import require_permission
from apps.common.views import TenantScopedAPIView, TenantScopedModelViewSet

from .models import Period, Room, TimetableEntry
from .serializers import PeriodSerializer, RoomSerializer, TimetableEntrySerializer

_ACTION_SUFFIX = {
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
}


class TimetableModelViewSet(TenantScopedModelViewSet):
    """Shared permission wiring for the timetable.* codes across Room/Period/TimetableEntry."""

    def get_permissions(self):
        code = f"timetable.{_ACTION_SUFFIX.get(self.action, 'view')}"
        return [require_permission(code)()]


class RoomViewSet(TimetableModelViewSet):
    serializer_class = RoomSerializer
    search_fields = ["name"]
    ordering_fields = ["name"]
    summary_stats = {
        "total": {},
    }

    def get_queryset(self):
        return Room.objects.all()


class PeriodViewSet(TimetableModelViewSet):
    serializer_class = PeriodSerializer
    search_fields = ["name"]
    ordering_fields = ["order", "start_time"]
    summary_stats = {
        "total": {},
        "class_periods": {"is_break": False},
        "breaks": {"is_break": True},
    }

    def get_queryset(self):
        return Period.objects.all()


class TimetableEntryViewSet(TimetableModelViewSet):
    serializer_class = TimetableEntrySerializer
    filterset_fields = ["section", "day_of_week", "teacher", "room"]

    def get_queryset(self):
        return TimetableEntry.objects.select_related(
            "section", "period", "subject", "teacher__user", "room"
        ).all()


class MyTimetableView(TenantScopedAPIView):
    """
    Convenience read: the authenticated user's own timetable — a teacher's
    assigned lessons, or a student's section's lessons. Anyone with a
    profile can view their own; no separate permission check beyond being
    a school member, since this is inherently scoped to "your own".
    """

    def get(self, request):
        entries = TimetableEntry.objects.none()

        staff_profile = getattr(request.user, "staff_profile", None)
        student_profile = getattr(request.user, "student_profile", None)

        if staff_profile is not None:
            entries = TimetableEntry.objects.filter(teacher=staff_profile)
        elif student_profile is not None and student_profile.current_section_id:
            entries = TimetableEntry.objects.filter(section_id=student_profile.current_section_id)

        entries = entries.select_related("section", "period", "subject", "teacher__user", "room")
        return Response(
            {
                "success": True,
                "message": "",
                "code": "OK",
                "errors": [],
                "results": TimetableEntrySerializer(entries, many=True).data,
            }
        )
