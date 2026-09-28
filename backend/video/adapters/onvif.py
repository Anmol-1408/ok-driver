from .base import BaseVideoAdapter


class ONVIFAdapter(BaseVideoAdapter):

    def __init__(self, endpoint, configuration=None):
        self.endpoint = endpoint
        self.configuration = configuration or {}

    def get_stream(self):
        stream_format = self.configuration.get(
            "stream_format",
            "RTSP",
        )

        return {
            "type": "ONVIF",
            "format": stream_format,
            "url": self.endpoint,
            "browser_playable": False,
            "requires_relay": True,
        }

    def health_check(self):
        return {
            "available": None,
            "status": "UNKNOWN",
            "message": (
                "ONVIF discovery/health checking will be "
                "handled by the ONVIF integration service."
            ),
        }