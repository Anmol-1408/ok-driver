from .base import BaseVideoAdapter


class HLSAdapter(BaseVideoAdapter):

    def __init__(self, endpoint, configuration=None):
        self.endpoint = endpoint
        self.configuration = configuration or {}

    def get_stream(self):
        return {
            "type": "HLS",
            "format": "HLS",
            "url": self.endpoint,
            "browser_playable": True,
            "requires_relay": False,
        }

    def health_check(self):
        return {
            "available": True,
            "status": "ONLINE",
        }