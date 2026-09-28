from django.db import models

from cameras.models import Camera


class Detection(models.Model):
    class DetectionType(models.TextChoices):
        VEHICLE = "VEHICLE", "Vehicle"
        PERSON = "PERSON", "Person"
        PLATE = "PLATE", "License Plate"
        HELMET = "HELMET", "Helmet"
        FACE = "FACE", "Face"
        OTHER = "OTHER", "Other"

    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE,
        related_name="detections",
    )

    detection_type = models.CharField(
        max_length=30,
        choices=DetectionType.choices,
        db_index=True,
    )

    entity_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    label = models.CharField(
        max_length=255,
        blank=True,
    )

    confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    detected_at = models.DateTimeField(
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-detected_at"]
        indexes = [
            models.Index(
                fields=["camera", "detected_at"]
            ),
            models.Index(
                fields=["detection_type", "detected_at"]
            ),
            models.Index(
                fields=["entity_id", "detected_at"]
            ),
        ]

    def __str__(self):
        return (
            f"{self.detection_type} - "
            f"{self.entity_id or self.label or 'Unknown'}"
        )


class Alert(models.Model):
    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        RESOLVED = "RESOLVED", "Resolved"

    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE,
        related_name="alerts",
    )

    detection = models.ForeignKey(
        Detection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alerts",
    )

    title = models.CharField(
        max_length=255,
    )

    message = models.TextField(
        blank=True,
    )

    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        db_index=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    entity_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    triggered_at = models.DateTimeField(
        db_index=True,
    )

    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-triggered_at"]
        indexes = [
            models.Index(
                fields=["status", "severity"]
            ),
            models.Index(
                fields=["camera", "status"]
            ),
            models.Index(
                fields=["entity_id", "triggered_at"]
            ),
        ]

    def __str__(self):
        return f"{self.severity} - {self.title}"


class Event(models.Model):
    class EventType(models.TextChoices):
        DETECTION = "DETECTION", "Detection"
        ALERT = "ALERT", "Alert"
        CAMERA_ONLINE = "CAMERA_ONLINE", "Camera Online"
        CAMERA_OFFLINE = "CAMERA_OFFLINE", "Camera Offline"
        CAMERA_DEGRADED = "CAMERA_DEGRADED", "Camera Degraded"
        SYSTEM = "SYSTEM", "System"

    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )

    detection = models.ForeignKey(
        Detection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )

    alert = models.ForeignKey(
        Alert,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )

    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
        db_index=True,
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
    )

    entity_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    occurred_at = models.DateTimeField(
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(
                fields=["event_type", "occurred_at"]
            ),
            models.Index(
                fields=["entity_id", "occurred_at"]
            ),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.title}"