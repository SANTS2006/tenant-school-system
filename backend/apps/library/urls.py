from rest_framework.routers import DefaultRouter

from .views import BookCategoryViewSet, BookCopyViewSet, BookLoanViewSet, BookReservationViewSet, BookViewSet

router = DefaultRouter()
router.register("categories", BookCategoryViewSet, basename="book-category")
router.register("books", BookViewSet, basename="book")
router.register("copies", BookCopyViewSet, basename="book-copy")
router.register("loans", BookLoanViewSet, basename="book-loan")
router.register("reservations", BookReservationViewSet, basename="book-reservation")

app_name = "library"

urlpatterns = router.urls
