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
export type UserRole = "super_admin" | "traffic_monitor" | "police" | "fire_fighter";
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

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type Invitation = {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  registration_url: string | null;
  email_sent: boolean;
  expires_at: string;
  accepted_at: string | null;
};

export type Notification = {
  id: string;
  incident_id: string;
  recipient_role: UserRole;
  message: string;
  created_by_id: string;
  read_at: string | null;
  created_at: string;
};

export type SimulatorSettings = {
  interval_seconds: number;
  is_enabled: boolean;
  updated_at: string;
};
