import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCameras,
  type Camera as CameraType,
} from "@/lib/camera-api";

import {
  getAlerts,
  getDashboardStats,
  getDetections,
  getEvents,
  type Alert,
  type DashboardStats,
  type Detection,
  type MonitoringEvent,
} from "@/lib/monitoring-api";

import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type CameraStatus =
  | "ALL"
  | "ONLINE"
  | "OFFLINE"
  | "DEGRADED";

type CameraFormData = {
  camera_id: string;
  name: string;
  department: string;
  latitude: string;
  longitude: string;
  camera_type: "TRAFFIC" | "RTO" | "CITY" | "OTHER";
  source_protocol:
    | "RTSP"
    | "ONVIF"
    | "HTTP"
    | "HLS"
    | "WEBRTC"
    | "SIMULATOR";
  stream_endpoint: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  zone: string;
  is_active: boolean;
};

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  description,
  symbol,
}: {
  title: string;
  value: number | string;
  description: string;
  symbol: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-400">
          {symbol}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: CameraType["status"];
}) {
  const config = {
    ONLINE: {
      label: "Online",
      color:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },

    OFFLINE: {
      label: "Offline",
      color:
        "border-red-500/30 bg-red-500/10 text-red-400",
    },

    DEGRADED: {
      label: "Degraded",
      color:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",
    },
  };

  const current = config[status] || config.OFFLINE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${current.color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {current.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Severity Badge                                                             */
/* -------------------------------------------------------------------------- */

function SeverityBadge({
  severity,
}: {
  severity: Alert["severity"];
}) {
  const config = {
    LOW: "border-slate-700 bg-slate-800 text-slate-400",
    MEDIUM:
      "border-blue-500/20 bg-blue-500/10 text-blue-400",
    HIGH:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
    CRITICAL:
      "border-red-500/20 bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-medium ${config[severity]}`}
    >
      {severity}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Alert Status Badge                                                         */
/* -------------------------------------------------------------------------- */

function AlertStatusBadge({
  status,
}: {
  status: Alert["status"];
}) {
  const config = {
    ACTIVE:
      "border-red-500/20 bg-red-500/10 text-red-400",
    ACKNOWLEDGED:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
    RESOLVED:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] ${config[status]}`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Camera Card                                                                */
/* -------------------------------------------------------------------------- */

function CameraCard({
  camera,
}: {
  camera: CameraType;
}) {
  const isOnline = camera.status === "ONLINE";

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:border-slate-700">
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {isOnline && camera.stream_endpoint ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg text-emerald-400">
              LIVE
            </div>

            <p className="mt-3 text-xs font-medium text-slate-400">
              Live source connected
            </p>

            <p className="mt-1 text-[11px] text-slate-600">
              {camera.source_protocol}
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg text-slate-600">
              OFF
            </div>

            <p className="mt-3 text-xs text-slate-600">
              Camera feed unavailable
            </p>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <StatusBadge status={camera.status} />
        </div>

        <div className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[10px] text-slate-300 backdrop-blur">
          {camera.camera_id}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-white">
              {camera.name}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-500">
              {camera.department}
            </p>
          </div>

          <span className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-500">
            {camera.camera_type}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
          <span>ZONE</span>

          <span>
            {camera.zone || "No zone assigned"}
          </span>
        </div>

        {camera.last_heartbeat && (
          <p className="mt-2 text-[11px] text-slate-700">
            Last heartbeat:{" "}
            {new Date(
              camera.last_heartbeat,
            ).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  message = "No data found",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-xl text-slate-700">
        —
      </div>

      <p className="mt-4 text-sm text-slate-400">
        {message}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Health Row                                                                 */
/* -------------------------------------------------------------------------- */

function HealthRow({
  label,
  value,
  healthy = false,
}: {
  label: string;
  value: string | number;
  healthy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-medium ${
          healthy
            ? "text-emerald-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create Camera Modal                                                        */
/* -------------------------------------------------------------------------- */

function CreateCameraModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] =
    useState<CameraFormData>({
      camera_id: "",
      name: "",
      department: "",
      latitude: "",
      longitude: "",
      camera_type: "TRAFFIC",
      source_protocol: "HLS",
      stream_endpoint: "",
      status: "OFFLINE",
      zone: "",
      is_active: true,
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function updateField(
    field: keyof CameraFormData,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      camera_id: "",
      name: "",
      department: "",
      latitude: "",
      longitude: "",
      camera_type: "TRAFFIC",
      source_protocol: "HLS",
      stream_endpoint: "",
      status: "OFFLINE",
      zone: "",
      is_active: true,
    });

    setError(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);

      if (
        !form.camera_id.trim() ||
        !form.name.trim() ||
        !form.department.trim()
      ) {
        setError(
          "Camera ID, name and department are required.",
        );

        return;
      }

      if (
        Number.isNaN(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        setError(
          "Latitude must be between -90 and 90.",
        );

        return;
      }

      if (
        Number.isNaN(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError(
          "Longitude must be between -180 and 180.",
        );

        return;
      }

      await api.post("/api/cameras/", {
        camera_id: form.camera_id.trim(),
        name: form.name.trim(),
        department: form.department.trim(),
        latitude,
        longitude,
        camera_type: form.camera_type,
        source_protocol:
          form.source_protocol,
        stream_endpoint:
          form.stream_endpoint.trim(),
        status: form.status,
        zone: form.zone.trim(),
        storage_metadata: {},
        is_active: form.is_active,
      });

      await onCreated();

      resetForm();
      onClose();
    } catch (err) {
      console.error(
        "Create camera error:",
        err,
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to create camera.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0a1018] shadow-2xl">
        {/* Modal header */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0a1018] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Add Camera
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Register a new camera in the monitoring system.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-xs text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Basic information */}

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              Basic Information
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Camera ID *
                </label>

                <input
                  required
                  value={form.camera_id}
                  onChange={(event) =>
                    updateField(
                      "camera_id",
                      event.target.value,
                    )
                  }
                  placeholder="C001"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Camera Name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="MG Road Junction Camera"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Department *
                </label>

                <input
                  required
                  value={form.department}
                  onChange={(event) =>
                    updateField(
                      "department",
                      event.target.value,
                    )
                  }
                  placeholder="Traffic Police"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Zone
                </label>

                <input
                  value={form.zone}
                  onChange={(event) =>
                    updateField(
                      "zone",
                      event.target.value,
                    )
                  }
                  placeholder="Central Delhi"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Location */}

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              Location
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Latitude *
                </label>

                <input
                  required
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={(event) =>
                    updateField(
                      "latitude",
                      event.target.value,
                    )
                  }
                  placeholder="28.6139"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Longitude *
                </label>

                <input
                  required
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={(event) =>
                    updateField(
                      "longitude",
                      event.target.value,
                    )
                  }
                  placeholder="77.2090"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Camera configuration */}

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              Camera Configuration
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Camera Type
                </label>

                <select
                  value={form.camera_type}
                  onChange={(event) =>
                    updateField(
                      "camera_type",
                      event.target.value as CameraFormData["camera_type"],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-slate-600"
                >
                  <option value="TRAFFIC">
                    Traffic
                  </option>

                  <option value="RTO">
                    RTO
                  </option>

                  <option value="CITY">
                    City
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Source Protocol
                </label>

                <select
                  value={form.source_protocol}
                  onChange={(event) =>
                    updateField(
                      "source_protocol",
                      event.target.value as CameraFormData["source_protocol"],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-slate-600"
                >
                  <option value="HLS">
                    HLS
                  </option>

                  <option value="RTSP">
                    RTSP
                  </option>

                  <option value="ONVIF">
                    ONVIF
                  </option>

                  <option value="HTTP">
                    HTTP
                  </option>

                  <option value="WEBRTC">
                    WebRTC
                  </option>

                  <option value="SIMULATOR">
                    Simulator
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Camera Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value as CameraFormData["status"],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-slate-600"
                >
                  <option value="OFFLINE">
                    Offline
                  </option>

                  <option value="ONLINE">
                    Online
                  </option>

                  <option value="DEGRADED">
                    Degraded
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-400">
                  Stream Endpoint
                </label>

                <input
                  value={form.stream_endpoint}
                  onChange={(event) =>
                    updateField(
                      "stream_endpoint",
                      event.target.value,
                    )
                  }
                  placeholder="https://example.com/live.m3u8"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Active toggle */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">
                  Camera active
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Allow this camera to be used by the monitoring system.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateField(
                    "is_active",
                    !form.is_active,
                  )
                }
                className={`relative h-6 w-11 rounded-full transition ${
                  form.is_active
                    ? "bg-emerald-500"
                    : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    form.is_active
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Buttons */}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creating..."
                : "Create Camera"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const [cameras, setCameras] = useState<CameraType[]>([]);

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<MonitoringEvent[]>(
    [],
  );

  const [detections, setDetections] = useState<
    Detection[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [monitoringLoading, setMonitoringLoading] =
    useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");

  const [entitySearch, setEntitySearch] = useState("");

  const [status, setStatus] = useState<CameraStatus>(
    "ALL",
  );

  const [createCameraOpen, setCreateCameraOpen] =
    useState(false);

  const loadCameras = useCallback(
    async (
      nextSearch = search,
      nextStatus = status,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getCameras({
          search: nextSearch || undefined,

          status:
            nextStatus === "ALL"
              ? undefined
              : nextStatus,
        });

        setCameras(response);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load cameras.",
        );
      } finally {
        setLoading(false);
      }
    },
    [search, status],
  );

  const loadMonitoring = useCallback(
    async (entity?: string) => {
      try {
        setMonitoringLoading(true);

        const [
          dashboardStats,
          activeAlerts,
          recentEvents,
          recentDetections,
        ] = await Promise.all([
          getDashboardStats(),

          getAlerts({
            status: "ACTIVE",
          }),

          getEvents(),

          getDetections({
            entity: entity || undefined,
          }),
        ]);

        setStats(dashboardStats);
        setAlerts(activeAlerts);
        setEvents(recentEvents);
        setDetections(recentDetections);
      } catch (err) {
        console.error("Monitoring API error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load monitoring data.",
        );
      } finally {
        setMonitoringLoading(false);
      }
    },
    [],
  );

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadCameras(),
      loadMonitoring(entitySearch),
    ]);
  }, [
    loadCameras,
    loadMonitoring,
    entitySearch,
  ]);

  useEffect(() => {
    loadAll();
  }, []);

  const counts = useMemo(() => {
    if (stats) {
      return stats.cameras;
    }

    const online = cameras.filter(
      (camera) => camera.status === "ONLINE",
    ).length;

    const offline = cameras.filter(
      (camera) => camera.status === "OFFLINE",
    ).length;

    const degraded = cameras.filter(
      (camera) => camera.status === "DEGRADED",
    ).length;

    return {
      total: cameras.length,
      online,
      offline,
      degraded,
    };
  }, [stats, cameras]);

  const availability =
    counts.total > 0
      ? Math.round(
          (counts.online / counts.total) * 100,
        )
      : 0;

  async function handleEntitySearch() {
    await loadMonitoring(entitySearch);
  }

  async function handleCameraCreated() {
    await loadCameras(search, status);
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-slate-800 bg-[#0a1018]">
        <div className="mx-auto max-w-[1800px] px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                  OD
                </div>

                <div>
                  <h1 className="text-xl font-semibold">
                    Unified Monitoring
                  </h1>

                  <p className="text-xs text-slate-500">
                    okDriver Operations Center
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                System operational
              </div>

              {/* Add Camera */}

              <button
                onClick={() =>
                  setCreateCameraOpen(true)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-emerald-400"
              >
                <span className="text-base leading-none">
                  +
                </span>

                Add Camera
              </button>

              {/* Refresh */}

              <button
                onClick={loadAll}
                disabled={
                  loading || monitoringLoading
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                <span
                  className={
                    loading || monitoringLoading
                      ? "animate-spin"
                      : ""
                  }
                >
                  ↻
                </span>

                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-6 px-5 py-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Statistics                                                       */}
        {/* ---------------------------------------------------------------- */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Cameras"
            value={counts.total}
            description="Registered cameras"
            symbol="CAM"
          />

          <StatCard
            title="Online"
            value={counts.online}
            description="Healthy feeds"
            symbol="ON"
          />

          <StatCard
            title="Offline"
            value={counts.offline}
            description="Unavailable feeds"
            symbol="OFF"
          />

          <StatCard
            title="Degraded"
            value={counts.degraded}
            description="Needs attention"
            symbol="!"
          />

          <StatCard
            title="Active Alerts"
            value={stats?.alerts.active ?? 0}
            description="Operator attention"
            symbol="AL"
          />

          <StatCard
            title="Detections"
            value={stats?.detections.total ?? 0}
            description="AI detections"
            symbol="AI"
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Search and filters                                                */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                SEARCH
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadCameras(search, status);
                  }
                }}
                placeholder="Search camera ID, name, department or zone..."
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-16 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["ALL", "All"],
                ["ONLINE", "Online"],
                ["OFFLINE", "Offline"],
                ["DEGRADED", "Degraded"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    const nextStatus =
                      value as CameraStatus;

                    setStatus(nextStatus);

                    loadCameras(
                      search,
                      nextStatus,
                    );
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    status === value
                      ? "border-slate-600 bg-slate-800 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Error                                                             */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-400">
              Unable to load monitoring data
            </p>

            <p className="mt-1 text-xs text-red-400/70">
              {error}
            </p>

            <button
              onClick={loadAll}
              className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Camera Grid + Alerts                                              */}
        {/* ---------------------------------------------------------------- */}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Live Camera Grid
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  {cameras.length} cameras currently displayed
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {counts.online}
                </span>

                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {counts.offline}
                </span>

                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {counts.degraded}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                <div className="text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />

                  <p className="mt-3 text-xs text-slate-600">
                    Loading cameras...
                  </p>
                </div>
              </div>
            ) : cameras.length === 0 ? (
              <EmptyState message="No cameras found" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {cameras.map((camera) => (
                  <CameraCard
                    key={camera.id}
                    camera={camera}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Active Alerts                                                    */}
          {/* ---------------------------------------------------------------- */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">
                  Active Alerts
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Operator attention required
                </p>
              </div>

              <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-400">
                {alerts.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {monitoringLoading ? (
                <div className="py-10 text-center text-xs text-slate-600">
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState message="No active alerts" />
              ) : (
                alerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {alert.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {alert.camera_name}
                        </p>
                      </div>

                      <SeverityBadge
                        severity={alert.severity}
                      />
                    </div>

                    {alert.entity_id && (
                      <p className="mt-2 text-xs text-slate-400">
                        Entity:{" "}
                        <span className="text-white">
                          {alert.entity_id}
                        </span>
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <AlertStatusBadge
                        status={alert.status}
                      />

                      <span className="text-[10px] text-slate-600">
                        {formatTime(
                          alert.triggered_at,
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Lower dashboard                                                   */}
        {/* ---------------------------------------------------------------- */}

        <section className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div>
              <p className="text-xs text-slate-600">
                ACTIVITY
              </p>

              <h2 className="mt-1 font-semibold">
                Recent Activity
              </h2>

              <p className="text-xs text-slate-600">
                Timestamped system events
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {monitoringLoading ? (
                <div className="py-10 text-center text-xs text-slate-600">
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <EmptyState message="No recent events" />
              ) : (
                events.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    className="border-l border-slate-700 pl-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-300">
                        {event.title}
                      </p>

                      <span className="shrink-0 text-[10px] text-slate-600">
                        {formatTime(
                          event.occurred_at,
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                      {event.camera_name ||
                        "System event"}
                    </p>

                    {event.entity_id && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Entity: {event.entity_id}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vehicle / Entity Search */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div>
              <p className="text-xs text-slate-600">
                SEARCH
              </p>

              <h2 className="mt-1 font-semibold">
                Vehicle / Entity Search
              </h2>

              <p className="text-xs text-slate-600">
                Search detected entities
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <input
                value={entitySearch}
                onChange={(event) =>
                  setEntitySearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleEntitySearch();
                  }
                }}
                placeholder="Vehicle number..."
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
              />

              <button
                onClick={handleEntitySearch}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs text-slate-300 hover:bg-slate-700"
              >
                Search
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {entitySearch &&
              detections.length > 0 ? (
                detections
                  .slice(0, 5)
                  .map((detection) => (
                    <div
                      key={detection.id}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">
                          {detection.entity_id ||
                            detection.label ||
                            "Unknown"}
                        </span>

                        <span className="text-[10px] text-emerald-400">
                          {detection.confidence !==
                          null
                            ? `${detection.confidence}%`
                            : "—"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {detection.camera_name}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        {formatTime(
                          detection.detected_at,
                        )}
                      </p>
                    </div>
                  ))
              ) : entitySearch ? (
                <EmptyState message="No matching entity found" />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-800 p-5 text-center">
                  <p className="text-xs text-slate-600">
                    Enter a vehicle number or entity ID.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Health */}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div>
              <p className="text-xs text-slate-600">
                HEALTH
              </p>

              <h2 className="mt-1 font-semibold">
                Camera Health
              </h2>

              <p className="text-xs text-slate-600">
                Current camera network
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <HealthRow
                label="Online cameras"
                value={counts.online}
                healthy
              />

              <HealthRow
                label="Offline cameras"
                value={counts.offline}
              />

              <HealthRow
                label="Degraded cameras"
                value={counts.degraded}
              />

              <div className="border-t border-slate-800 pt-4">
                <HealthRow
                  label="Network availability"
                  value={`${availability}%`}
                  healthy
                />
              </div>

              <div className="border-t border-slate-800 pt-4">
                <HealthRow
                  label="Critical alerts"
                  value={stats?.alerts.critical ?? 0}
                />

                <div className="mt-4">
                  <HealthRow
                    label="High alerts"
                    value={stats?.alerts.high ?? 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Recent Detections                                                */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600">
                AI ANALYTICS
              </p>

              <h2 className="mt-1 font-semibold">
                Recent Detections
              </h2>

              <p className="text-xs text-slate-600">
                Latest objects and entities detected by cameras
              </p>
            </div>

            <span className="text-xs text-slate-600">
              {stats?.detections.total ?? 0} total
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            {detections.length === 0 ? (
              <EmptyState message="No detections available" />
            ) : (
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-600">
                    <th className="px-3 py-3 font-medium">
                      Type
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Entity
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Camera
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Confidence
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {detections
                    .slice(0, 10)
                    .map((detection) => (
                      <tr
                        key={detection.id}
                        className="border-b border-slate-900 text-sm"
                      >
                        <td className="px-3 py-3 text-slate-300">
                          {detection.detection_type}
                        </td>

                        <td className="px-3 py-3 text-white">
                          {detection.entity_id ||
                            detection.label ||
                            "Unknown"}
                        </td>

                        <td className="px-3 py-3 text-slate-400">
                          {detection.camera_name}
                        </td>

                        <td className="px-3 py-3 text-emerald-400">
                          {detection.confidence !==
                          null
                            ? `${detection.confidence}%`
                            : "—"}
                        </td>

                        <td className="px-3 py-3 text-slate-500">
                          {formatTime(
                            detection.detected_at,
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Create Camera Modal                                                */}
      {/* ------------------------------------------------------------------ */}

      <CreateCameraModal
        open={createCameraOpen}
        onClose={() =>
          setCreateCameraOpen(false)
        }
        onCreated={handleCameraCreated}
      />
    </div>
  );
}

