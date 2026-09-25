from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ExamScheduleViewSet,
    ExamViewSet,
    GradeBoundaryViewSet,
    GradingScaleViewSet,
    MyTranscriptView,
    ResultViewSet,
)

router = DefaultRouter()
router.register("grading-scales", GradingScaleViewSet, basename="grading-scale")
router.register("grade-boundaries", GradeBoundaryViewSet, basename="grade-boundary")
router.register("exams", ExamViewSet, basename="exam")
router.register("schedules", ExamScheduleViewSet, basename="exam-schedule")

app_name = "examinations"

urlpatterns = router.urls

results_router = DefaultRouter()
results_router.register("", ResultViewSet, basename="result")
# The static "transcript/me/" path is listed BEFORE the router's bare ""-registered {pk} detail
# route so it always matches first, avoiding the routing collision documented in Phase G.
result_urlpatterns = [
    path("transcript/me/", MyTranscriptView.as_view(), name="my-transcript"),
] + results_router.urls
