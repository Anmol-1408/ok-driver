from django.urls import path

from .views import (
    AlertListView,
    DashboardStatsView,
    DetectionListView,
    EventListView,
)


urlpatterns = [
    path(
        "dashboard/",
        DashboardStatsView.as_view(),
        name="dashboard-stats",
    ),
    path(
        "detections/",
        DetectionListView.as_view(),
        name="detection-list",
    ),
    path(
        "alerts/",
        AlertListView.as_view(),
        name="alert-list",
    ),
    path(
        "events/",
        EventListView.as_view(),
        name="event-list",
    ),
]