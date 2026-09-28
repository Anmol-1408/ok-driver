from django.db import models

from cameras.models import Camera


class VideoSource(models.Model):

    class SourceType(models.TextChoices):
        SIMULATOR = "SIMULATOR", "Simulator"
        HLS = "HLS", "HLS"
        RTSP = "RTSP", "RTSP"
        ONVIF = "ONVIF", "ONVIF"
        VENDOR_API = "VENDOR_API", "Vendor API"

    class StreamFormat(models.TextChoices):
        HLS = "HLS", "HLS"
        MP4 = "MP4", "MP4"
        RTSP = "RTSP", "RTSP"
        WEBRTC = "WEBRTC", "WebRTC"

    camera = models.OneToOneField(
        Camera,
        on_delete=models.CASCADE,
        related_name="video_source",
    )

    source_type = models.CharField(
        max_length=30,
        choices=SourceType.choices,
    )

    stream_format = models.CharField(
        max_length=20,
        choices=StreamFormat.choices,
    )

    endpoint = models.TextField()

    is_enabled = models.BooleanField(
        default=True,
    )

    configuration = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.camera.camera_id} - {self.source_type}"