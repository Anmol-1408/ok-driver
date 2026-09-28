from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .adapters.factory import get_video_adapter
from .models import VideoSource
from .serializers import VideoSourceSerializer


class VideoSourceViewSet(viewsets.ModelViewSet):

    queryset = VideoSource.objects.select_related(
        "camera"
    )

    serializer_class = VideoSourceSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    @action(
        detail=True,
        methods=["get"],
        url_path="stream",
    )
    def stream(self, request, pk=None):

        video_source = self.get_object()

        if not video_source.is_enabled:
            return Response(
                {
                    "detail": "Video source is disabled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            adapter = get_video_adapter(
                video_source
            )

            stream = adapter.get_stream()

        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "camera_id": video_source.camera.camera_id,
                "source_type": video_source.source_type,
                "stream_format": video_source.stream_format,
                "stream": stream,
            }
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="health",
    )
    def health(self, request, pk=None):

        video_source = self.get_object()

        try:
            adapter = get_video_adapter(
                video_source
            )

            result = adapter.health_check()

        except ValueError as exc:
            return Response(
                {
                    "camera_id": video_source.camera.camera_id,
                    "available": False,
                    "status": "ERROR",
                    "message": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "camera_id": video_source.camera.camera_id,
                **result,
            }
        )