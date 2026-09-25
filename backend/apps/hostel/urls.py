from rest_framework.routers import DefaultRouter

from .views import BedViewSet, HostelAllocationViewSet, HostelViewSet, RoomViewSet

router = DefaultRouter()
router.register("hostels", HostelViewSet, basename="hostel")
router.register("rooms", RoomViewSet, basename="hostel-room")
router.register("beds", BedViewSet, basename="hostel-bed")
router.register("allocations", HostelAllocationViewSet, basename="hostel-allocation")

app_name = "hostel"

urlpatterns = router.urls
