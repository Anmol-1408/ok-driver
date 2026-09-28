from django.conf import settings
from django.db import models


class CameraAuditLog(models.Model):

    class Action(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPDATED = "UPDATED", "Updated"
        DISABLED = "DISABLED", "Disabled"
        ENABLED = "ENABLED", "Enabled"

    camera_id = models.CharField(
        max_length=50,
        db_index=True,
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
    )

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="camera_audit_logs",
    )

    changes = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["camera_id", "created_at"]
            ),
        ]

    def __str__(self):
        return f"{self.camera_id} - {self.action}"