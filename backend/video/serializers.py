from rest_framework import serializers

from .models import VideoSource


class VideoSourceSerializer(
    serializers.ModelSerializer
):

    camera_id = serializers.CharField(
        source="camera.camera_id",
        read_only=True,
    )

    class Meta:
        model = VideoSource

        fields = [
            "id",
            "camera",
            "camera_id",
            "source_type",
            "stream_format",
            "endpoint",
            "is_enabled",
            "configuration",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "camera_id",
        ]