from .hls import HLSAdapter
from .onvif import ONVIFAdapter
from .rtsp import RTSPAdapter
from .simulator import SimulatorAdapter


def get_video_adapter(video_source):

    adapter_map = {
        "SIMULATOR": SimulatorAdapter,
        "HLS": HLSAdapter,
        "RTSP": RTSPAdapter,
        "ONVIF": ONVIFAdapter,
    }

    adapter_class = adapter_map.get(
        video_source.source_type
    )

    if not adapter_class:
        raise ValueError(
            f"Unsupported video source type: "
            f"{video_source.source_type}"
        )

    return adapter_class(
        endpoint=video_source.endpoint,
        configuration=video_source.configuration,
    )