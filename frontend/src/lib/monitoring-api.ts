import { api } from "@/lib/api";

export type Detection = {
  id: number;
  camera: number;
  camera_id: string;
  camera_name: string;
  detection_type: string;
  entity_id: string;
  label: string;
  confidence: number | null;
  metadata: Record<string, unknown>;
  detected_at: string;
  created_at: string;
};

export type Alert = {
  id: number;
  camera: number;
  camera_id: string;
  camera_name: string;
  detection: number | null;
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  entity_id: string;
  metadata: Record<string, unknown>;
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MonitoringEvent = {
  id: number;
  camera: number | null;
  camera_id: string | null;
  camera_name: string | null;
  detection: number | null;
  alert: number | null;
  event_type:
    | "DETECTION"
    | "ALERT"
    | "CAMERA_ONLINE"
    | "CAMERA_OFFLINE"
    | "CAMERA_DEGRADED"
    | "SYSTEM";
  title: string;
  description: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
};

export type DashboardStats = {
  cameras: {
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  alerts: {
    active: number;
    critical: number;
    high: number;
  };
  detections: {
    total: number;
  };
  events: {
    total: number;
  };
  detection_breakdown: {
    detection_type: string;
    count: number;
  }[];
};

export async function getDashboardStats() {
  return api.get<DashboardStats>(
    "/api/monitoring/dashboard/",
  );
}

export async function getAlerts(params?: {
  status?: string;
  severity?: string;
  camera_id?: string;
  entity?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.severity) {
    searchParams.set("severity", params.severity);
  }

  if (params?.camera_id) {
    searchParams.set("camera_id", params.camera_id);
  }

  if (params?.entity) {
    searchParams.set("entity", params.entity);
  }

  const query = searchParams.toString();

  return api.get<Alert[]>(
    `/api/monitoring/alerts/${query ? `?${query}` : ""}`,
  );
}

export async function getDetections(params?: {
  camera_id?: string;
  detection_type?: string;
  entity?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.camera_id) {
    searchParams.set("camera_id", params.camera_id);
  }

  if (params?.detection_type) {
    searchParams.set(
      "detection_type",
      params.detection_type,
    );
  }

  if (params?.entity) {
    searchParams.set("entity", params.entity);
  }

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();

  return api.get<Detection[]>(
    `/api/monitoring/detections/${query ? `?${query}` : ""}`,
  );
}

export async function getEvents(params?: {
  event_type?: string;
  camera_id?: string;
  entity?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.event_type) {
    searchParams.set("event_type", params.event_type);
  }

  if (params?.camera_id) {
    searchParams.set("camera_id", params.camera_id);
  }

  if (params?.entity) {
    searchParams.set("entity", params.entity);
  }

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();

  return api.get<MonitoringEvent[]>(
    `/api/monitoring/events/${query ? `?${query}` : ""}`,
  );
}