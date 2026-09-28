from rest_framework import serializers

from .models import CameraAuditLog


class CameraAuditLogSerializer(
    serializers.ModelSerializer
):

    performed_by_email = serializers.EmailField(
        source="performed_by.email",
        read_only=True,
    )

    class Meta:
        model = CameraAuditLog

        fields = [
            "id",
            "camera_id",
            "action",
            "performed_by",
            "performed_by_email",
            "changes",
            "created_at",
        ]

        read_only_fields = fields