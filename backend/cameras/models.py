from django.db import models


class Camera(models.Model):

    class Status(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        OFFLINE = "OFFLINE", "Offline"
        DEGRADED = "DEGRADED", "Degraded"

    class CameraType(models.TextChoices):
        TRAFFIC = "TRAFFIC", "Traffic"
        RTO = "RTO", "RTO"
        CITY = "CITY", "City"
        OTHER = "OTHER", "Other"

    class SourceProtocol(models.TextChoices):
        RTSP = "RTSP", "RTSP"
        ONVIF = "ONVIF", "ONVIF"
        HTTP = "HTTP", "HTTP"
        HLS = "HLS", "HLS"
        WEBRTC = "WEBRTC", "WebRTC"
        SIMULATOR = "SIMULATOR", "Simulator"

    camera_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
    )

    name = models.CharField(
        max_length=255,
    )

    department = models.CharField(
        max_length=150,
        db_index=True,
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    camera_type = models.CharField(
        max_length=20,
        choices=CameraType.choices,
        default=CameraType.OTHER,
    )

    source_protocol = models.CharField(
        max_length=20,
        choices=SourceProtocol.choices,
    )

    # Reference to the stream.
    # We will later improve this for secure stream handling.
    stream_endpoint = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OFFLINE,
        db_index=True,
    )

    last_heartbeat = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    zone = models.CharField(
        max_length=150,
        blank=True,
        db_index=True,
    )

    storage_metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["department", "status"]
            ),
            models.Index(
                fields=["zone", "status"]
            ),
        ]

    def __str__(self):
        return f"{self.camera_id} - {self.name}"