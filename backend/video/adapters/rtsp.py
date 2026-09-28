from .base import BaseVideoAdapter


class RTSPAdapter(BaseVideoAdapter):

    def __init__(self, endpoint, configuration=None):
        self.endpoint = endpoint
        self.configuration = configuration or {}

    def get_stream(self):
        return {
            "type": "RTSP",
            "format": "RTSP",
            "url": self.endpoint,
            "requires_relay": True,
        }

    def health_check(self):
        return {
            "available": None,
            "status": "UNKNOWN",
            "message": (
                "RTSP health checking will be handled "
                "by the video relay/service."
            ),
        }