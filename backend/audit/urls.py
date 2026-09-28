from django.urls import path

from .views import CameraAuditLogListView


urlpatterns = [
    path(
        "camera/",
        CameraAuditLogListView.as_view(),
        name="camera-audit-list",
    ),
]