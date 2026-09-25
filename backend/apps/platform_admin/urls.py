from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PlatformAdminViewSet, PlatformStatsView

router = DefaultRouter()
router.register("admins", PlatformAdminViewSet, basename="platform-admin")

app_name = "platform_admin"

urlpatterns = [
    path("stats/", PlatformStatsView.as_view(), name="platform-stats"),
] + router.urls
