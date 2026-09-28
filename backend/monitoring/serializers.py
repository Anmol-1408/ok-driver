from rest_framework import serializers

from .models import Alert, Detection, Event


class DetectionSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(
        source="camera.name",
        read_only=True,
    )

    camera_id = serializers.CharField(
        source="camera.camera_id",
        read_only=True,
    )

    class Meta:
        model = Detection
        fields = [
            "id",
            "camera",
            "camera_id",
            "camera_name",
            "detection_type",
            "entity_id",
            "label",
            "confidence",
            "metadata",
            "detected_at",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class AlertSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(
        source="camera.name",
        read_only=True,
    )

    camera_id = serializers.CharField(
        source="camera.camera_id",
        read_only=True,
    )

    class Meta:
        model = Alert

        fields = [
            "id",
            "camera",
            "camera_id",
            "camera_name",
            "detection",
            "title",
            "message",
            "severity",
            "status",
            "entity_id",
            "metadata",
            "triggered_at",
            "acknowledged_at",
            "resolved_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class EventSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(
        source="camera.name",
        read_only=True,
    )

    camera_id = serializers.CharField(
        source="camera.camera_id",
        read_only=True,
    )

    class Meta:
        model = Event

        fields = [
            "id",
            "camera",
            "camera_id",
            "camera_name",
            "detection",
            "alert",
            "event_type",
            "title",
            "description",
            "entity_id",
            "metadata",
            "occurred_at",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]