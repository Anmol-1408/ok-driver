from django.contrib import admin

from .models import Camera


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):

    list_display = [
        "camera_id",
        "name",
        "department",
        "camera_type",
        "source_protocol",
        "status",
        "is_active",
        "last_heartbeat",
    ]

    list_filter = [
        "status",
        "camera_type",
        "source_protocol",
        "department",
        "is_active",
    ]

    search_fields = [
        "camera_id",
        "name",
        "department",
        "zone",
    ]

    ordering = [
        "-created_at",
    ]