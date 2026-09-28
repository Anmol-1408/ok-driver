from .base import BaseVideoAdapter


class SimulatorAdapter(BaseVideoAdapter):

    def __init__(self, endpoint, configuration=None):
        self.endpoint = endpoint
        self.configuration = configuration or {}

    def get_stream(self):
        return {
            "type": "SIMULATOR",
            "format": self.configuration.get(
                "format",
                "HLS",
            ),
            "url": self.endpoint,
        }

    def health_check(self):
        return {
            "available": True,
            "status": "ONLINE",
        }