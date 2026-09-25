from rest_framework.routers import DefaultRouter

from .views import StaffAttendanceViewSet, StudentAttendanceViewSet

router = DefaultRouter()
router.register("students", StudentAttendanceViewSet, basename="student-attendance")
router.register("staff", StaffAttendanceViewSet, basename="staff-attendance")

app_name = "attendance"

urlpatterns = router.urls
