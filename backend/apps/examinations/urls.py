from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ExamScheduleViewSet,
    ExamViewSet,
    GradeBoundaryViewSet,
    GradingScaleViewSet,
    MyTranscriptView,
)

router = DefaultRouter()
router.register("grading-scales", GradingScaleViewSet, basename="grading-scale")
router.register("grade-boundaries", GradeBoundaryViewSet, basename="grade-boundary")
router.register("exams", ExamViewSet, basename="exam")
router.register("schedules", ExamScheduleViewSet, basename="exam-schedule")

app_name = "examinations"

urlpatterns = router.urls

# Everything that used to live under "/api/v1/results/" (Enter Marks, the Results list, the
# admin Report Card lookup) was retired — see config/urls.py's import of `result_urlpatterns` for
# where this is mounted. Only the student's own self-service transcript remains at that prefix.
result_urlpatterns = [
    path("transcript/me/", MyTranscriptView.as_view(), name="my-transcript"),
]
