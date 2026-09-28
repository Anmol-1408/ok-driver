from django.contrib import admin

from .models import CameraAuditLog


@admin.register(CameraAuditLog)
class CameraAuditLogAdmin(admin.ModelAdmin):

    list_display = [
        "camera_id",
        "action",
        "performed_by",
        "created_at",
    ]

    list_filter = [
        "action",
        "created_at",
    ]

    search_fields = [
        "camera_id",
        "performed_by__email",
    ]

    readonly_fields = [
        "camera_id",
        "action",
        "performed_by",
        "changes",
        "created_at",
    ]