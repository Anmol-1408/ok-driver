from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.models import CameraAuditLog

from .models import Camera
from .permissions import IsAdminUserRole
from .serializers import CameraSerializer


class CameraViewSet(viewsets.ModelViewSet):

    serializer_class = CameraSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminUserRole,
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "camera_id",
        "name",
        "department",
        "zone",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "last_heartbeat",
        "name",
        "status",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        queryset = Camera.objects.all()

        status_value = self.request.query_params.get("status")
        department = self.request.query_params.get("department")
        camera_type = self.request.query_params.get("camera_type")
        protocol = self.request.query_params.get("source_protocol")
        zone = self.request.query_params.get("zone")
        is_active = self.request.query_params.get("is_active")

        if status_value:
            queryset = queryset.filter(
                status=status_value.upper()
            )

        if department:
            queryset = queryset.filter(
                department__iexact=department
            )

        if camera_type:
            queryset = queryset.filter(
                camera_type=camera_type.upper()
            )

        if protocol:
            queryset = queryset.filter(
                source_protocol=protocol.upper()
            )

        if zone:
            queryset = queryset.filter(
                zone__iexact=zone
            )

        if is_active is not None:
            queryset = queryset.filter(
                is_active=is_active.lower() == "true"
            )

        return queryset

    def perform_create(self, serializer):

        camera = serializer.save()

        CameraAuditLog.objects.create(
            camera_id=camera.camera_id,
            action=CameraAuditLog.Action.CREATED,
            performed_by=self.request.user,
            changes={
                "camera_name": camera.name,
                "department": camera.department,
                "status": camera.status,
            },
        )

    def perform_update(self, serializer):

        old_camera = self.get_object()

        old_values = {
            "name": old_camera.name,
            "department": old_camera.department,
            "status": old_camera.status,
            "zone": old_camera.zone,
            "is_active": old_camera.is_active,
        }

        camera = serializer.save()

        new_values = {
            "name": camera.name,
            "department": camera.department,
            "status": camera.status,
            "zone": camera.zone,
            "is_active": camera.is_active,
        }

        changes = {}

        for field in old_values:
            if old_values[field] != new_values[field]:
                changes[field] = {
                    "old": old_values[field],
                    "new": new_values[field],
                }

        CameraAuditLog.objects.create(
            camera_id=camera.camera_id,
            action=CameraAuditLog.Action.UPDATED,
            performed_by=self.request.user,
            changes=changes,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="disable",
    )
    def disable(self, request, pk=None):

        camera = self.get_object()

        if not camera.is_active:
            return Response(
                {
                    "detail": "Camera is already disabled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        camera.is_active = False
        camera.status = Camera.Status.OFFLINE
        camera.save(
            update_fields=[
                "is_active",
                "status",
                "updated_at",
            ]
        )

        CameraAuditLog.objects.create(
            camera_id=camera.camera_id,
            action=CameraAuditLog.Action.DISABLED,
            performed_by=request.user,
            changes={
                "is_active": {
                    "old": True,
                    "new": False,
                },
                "status": {
                    "new": Camera.Status.OFFLINE,
                },
            },
        )

        return Response(
            {
                "message": "Camera disabled successfully.",
                "camera_id": camera.camera_id,
                "is_active": camera.is_active,
                "status": camera.status,
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="enable",
    )
    def enable(self, request, pk=None):

        camera = self.get_object()

        if camera.is_active:
            return Response(
                {
                    "detail": "Camera is already active."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        camera.is_active = True
        camera.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        CameraAuditLog.objects.create(
            camera_id=camera.camera_id,
            action=CameraAuditLog.Action.ENABLED,
            performed_by=request.user,
            changes={
                "is_active": {
                    "old": False,
                    "new": True,
                },
            },
        )

        return Response(
            {
                "message": "Camera enabled successfully.",
                "camera_id": camera.camera_id,
                "is_active": camera.is_active,
            }
        )