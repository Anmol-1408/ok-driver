import { api } from "./api";

export type VideoSource = {
  id: number;
  camera: number;
  camera_id: string;
  source_type: "SIMULATOR" | "HLS" | "RTSP" | "ONVIF" | "VENDOR_API";
  stream_format: "HLS" | "MP4" | "RTSP" | "WEBRTC";
  endpoint: string;
  is_enabled: boolean;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type VideoSourceListResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: VideoSource[];
};

export type StreamResponse = {
  camera_id: string;
  source_type: string;
  stream_format: string;
  stream: {
    type: string;
    format: string;
    url: string;
    browser_playable?: boolean;
    requires_relay?: boolean;
  };
};

export async function getVideoSources(): Promise<VideoSource[]> {
  const response = await api.get<
    VideoSourceListResponse | VideoSource[]
  >("/api/video/sources/");

  return Array.isArray(response)
    ? response
    : response.results ?? [];
}

export async function getVideoStream(
  videoSourceId: number,
): Promise<StreamResponse> {
  return api.get<StreamResponse>(
    `/api/video/sources/${videoSourceId}/stream/`,
  );
}