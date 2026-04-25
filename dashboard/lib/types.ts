export type IncidentType =
  | "stopped_vehicle"
  | "debris"
  | "congestion"
  | "wrong_way_driver"
  | "pedestrian"
  | "accident"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "new" | "acknowledged" | "resolved" | "dismissed";
export type SortOption =
  | "detected_at"
  | "-detected_at"
  | "created_at"
  | "-created_at"
  | "severity"
  | "-severity";

export type Incident = {
  id: string;
  type: IncidentType;
  severity: Severity;
  status: Status;
  title: string;
  description: string;
  camera_id: string;
  camera_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  confidence: number;
  detected_at: string;
  created_at: string;
  updated_at: string;
};

export type IncidentList = {
  items: Incident[];
  total: number;
  page: number;
  page_size: number;
};

export type IncidentFilters = {
  type: string;
  severity: string;
  status: string;
  from: string;
  to: string;
  sort: SortOption;
};

export type IncidentCreatedMessage = {
  event: "incident.created";
  data: Incident;
};
