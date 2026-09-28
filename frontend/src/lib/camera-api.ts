import { api } from "./api";

export type CameraStatus = "ONLINE" | "OFFLINE" | "DEGRADED";

export type Camera = {
  id: number;
  camera_id: string;
  name: string;
  department: string;
  latitude: string;
  longitude: string;
  camera_type: string;
  source_protocol: string;
  stream_endpoint: string;
  status: CameraStatus;
  last_heartbeat: string | null;
  zone: string;
  storage_metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CameraListResponse = Camera[] | {
  results: Camera[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

export async function getCameras(params?: {
  search?: string;
  status?: CameraStatus;
  department?: string;
  camera_type?: string;
  zone?: string;
  is_active?: boolean;
}): Promise<Camera[]> {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.department) {
    searchParams.set("department", params.department);
  }

  if (params?.camera_type) {
    searchParams.set("camera_type", params.camera_type);
  }

  if (params?.zone) {
    searchParams.set("zone", params.zone);
  }

  if (params?.is_active !== undefined) {
    searchParams.set("is_active", String(params.is_active));
  }

  const query = searchParams.toString();

  const response = await api.get<CameraListResponse>(
    `/api/cameras/${query ? `?${query}` : ""}`,
  );

  if (Array.isArray(response)) {
    return response;
  }

  return response.results;
}