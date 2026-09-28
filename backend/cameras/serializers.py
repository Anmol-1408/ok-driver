from rest_framework import serializers

from .models import Camera


class CameraSerializer(serializers.ModelSerializer):

    class Meta:
        model = Camera

        fields = [
            "id",
            "camera_id",
            "name",
            "department",
            "latitude",
            "longitude",
            "camera_type",
            "source_protocol",
            "stream_endpoint",
            "status",
            "last_heartbeat",
            "zone",
            "storage_metadata",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                "Latitude must be between -90 and 90."
            )

        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                "Longitude must be between -180 and 180."
            )

        return value

    def validate_camera_id(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Camera ID cannot be empty."
            )

        return value