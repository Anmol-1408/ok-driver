from django.contrib import admin

from .models import Alert, Detection, Event


@admin.register(Detection)
class DetectionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "camera",
        "detection_type",
        "entity_id",
        "confidence",
        "detected_at",
    ]

    list_filter = [
        "detection_type",
        "detected_at",
    ]

    search_fields = [
        "entity_id",
        "label",
        "camera__camera_id",
        "camera__name",
    ]


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "camera",
        "severity",
        "status",
        "entity_id",
        "triggered_at",
    ]

    list_filter = [
        "severity",
        "status",
        "triggered_at",
    ]

    search_fields = [
        "title",
        "message",
        "entity_id",
        "camera__camera_id",
        "camera__name",
    ]


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "event_type",
        "title",
        "camera",
        "entity_id",
        "occurred_at",
    ]

    list_filter = [
        "event_type",
        "occurred_at",
    ]

    search_fields = [
        "title",
        "description",
        "entity_id",
        "camera__camera_id",
        "camera__name",
    ]