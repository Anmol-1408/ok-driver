from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import CameraAuditLog
from .serializers import CameraAuditLogSerializer


class CameraAuditLogListView(
    generics.ListAPIView
):

    serializer_class = CameraAuditLogSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):

        queryset = CameraAuditLog.objects.all()

        camera_id = self.request.query_params.get(
            "camera_id"
        )

        if camera_id:
            queryset = queryset.filter(
                camera_id=camera_id
            )

        return queryset