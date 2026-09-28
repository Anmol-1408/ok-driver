from django.db.models import Count
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cameras.models import Camera

from .models import Alert, Detection, Event
from .serializers import (
    AlertSerializer,
    DetectionSerializer,
    EventSerializer,
)


class DetectionListView(generics.ListAPIView):
    serializer_class = DetectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Detection.objects.select_related("camera")

        camera_id = self.request.query_params.get("camera_id")
        detection_type = self.request.query_params.get("detection_type")
        entity = self.request.query_params.get("entity")
        search = self.request.query_params.get("search")

        if camera_id:
            queryset = queryset.filter(
                camera__camera_id__iexact=camera_id
            )

        if detection_type:
            queryset = queryset.filter(
                detection_type=detection_type.upper()
            )

        if entity:
            queryset = queryset.filter(
                entity_id__icontains=entity
            )

        if search:
            queryset = queryset.filter(
                label__icontains=search
            ) | queryset.filter(
                entity_id__icontains=search
            )

        return queryset


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Alert.objects.select_related(
            "camera",
            "detection",
        )

        status_value = self.request.query_params.get("status")
        severity = self.request.query_params.get("severity")
        camera_id = self.request.query_params.get("camera_id")
        entity = self.request.query_params.get("entity")

        if status_value:
            queryset = queryset.filter(
                status=status_value.upper()
            )

        if severity:
            queryset = queryset.filter(
                severity=severity.upper()
            )

        if camera_id:
            queryset = queryset.filter(
                camera__camera_id__iexact=camera_id
            )

        if entity:
            queryset = queryset.filter(
                entity_id__icontains=entity
            )

        return queryset


class EventListView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Event.objects.select_related(
            "camera",
            "detection",
            "alert",
        )

        event_type = self.request.query_params.get("event_type")
        camera_id = self.request.query_params.get("camera_id")
        entity = self.request.query_params.get("entity")
        search = self.request.query_params.get("search")

        if event_type:
            queryset = queryset.filter(
                event_type=event_type.upper()
            )

        if camera_id:
            queryset = queryset.filter(
                camera__camera_id__iexact=camera_id
            )

        if entity:
            queryset = queryset.filter(
                entity_id__icontains=entity
            )

        if search:
            queryset = queryset.filter(
                title__icontains=search
            ) | queryset.filter(
                description__icontains=search
            ) | queryset.filter(
                entity_id__icontains=search
            )

        return queryset


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cameras = Camera.objects.filter(
            is_active=True
        )

        online_cameras = cameras.filter(
            status=Camera.Status.ONLINE
        ).count()

        offline_cameras = cameras.filter(
            status=Camera.Status.OFFLINE
        ).count()

        degraded_cameras = cameras.filter(
            status=Camera.Status.DEGRADED
        ).count()

        total_cameras = cameras.count()

        active_alerts = Alert.objects.filter(
            status=Alert.Status.ACTIVE
        ).count()

        critical_alerts = Alert.objects.filter(
            status=Alert.Status.ACTIVE,
            severity=Alert.Severity.CRITICAL,
        ).count()

        high_alerts = Alert.objects.filter(
            status=Alert.Status.ACTIVE,
            severity=Alert.Severity.HIGH,
        ).count()

        total_detections = Detection.objects.count()

        total_events = Event.objects.count()

        detection_breakdown = list(
            Detection.objects.values(
                "detection_type"
            )
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return Response({
            "cameras": {
                "total": total_cameras,
                "online": online_cameras,
                "offline": offline_cameras,
                "degraded": degraded_cameras,
            },
            "alerts": {
                "active": active_alerts,
                "critical": critical_alerts,
                "high": high_alerts,
            },
            "detections": {
                "total": total_detections,
            },
            "events": {
                "total": total_events,
            },
            "detection_breakdown": detection_breakdown,
        })