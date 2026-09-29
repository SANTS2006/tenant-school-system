from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ApplicationViewSet, PublicApplicationOptionsView, PublicApplyView

router = DefaultRouter()
router.register("applications", ApplicationViewSet, basename="application")

app_name = "admissions"

# Static public paths first, same collision-avoidance ordering as apps.tenants.urls.
urlpatterns = [
    path("apply/<slug:school_slug>/", PublicApplyView.as_view(), name="public-apply"),
    path("apply/<slug:school_slug>/options/", PublicApplicationOptionsView.as_view(), name="public-apply-options"),
] + router.urls
