from rest_framework.routers import DefaultRouter

from .views import RoleViewSet

router = DefaultRouter()
router.register("", RoleViewSet, basename="role")

app_name = "authorization"

urlpatterns = router.urls
