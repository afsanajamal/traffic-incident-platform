import type {
  AuthResponse,
  Incident,
  IncidentFilters,
  IncidentList,
  Invitation,
  Notification,
  SimulatorSettings,
  Status,
  User,
  UserRole,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchIncidents(
  filters: IncidentFilters,
  token: string,
): Promise<IncidentList> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/incidents?${params.toString()}`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch incidents");
  }

  return response.json();
}

export async function updateIncidentStatus(
  incidentId: string,
  status: Status,
  token: string,
): Promise<Incident> {
  const response = await fetch(
    `${API_BASE_URL}/api/incidents/${incidentId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update incident status");
  }

  return response.json();
}

export async function deleteIncident(
  incidentId: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to delete incident");
  }
}

export async function deleteIncidents(
  incidentIds: string[],
  token: string,
): Promise<{ deleted: number }> {
  const response = await fetch(`${API_BASE_URL}/api/incidents`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ incident_ids: incidentIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete incidents");
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Invalid email or password");
  }
  return response.json();
}

export async function registerWithInvite(
  invitationToken: string,
  fullName: string,
  password: string,
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitation_token: invitationToken,
      full_name: fullName,
      password,
    }),
  });
  if (!response.ok) {
    throw new Error("Registration failed");
  }
  return response.json();
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Session expired");
  }
  return response.json();
}

export async function fetchUsers(token: string): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

export async function createInvitation(
  email: string,
  role: UserRole,
  token: string,
): Promise<Invitation> {
  const response = await fetch(`${API_BASE_URL}/api/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    throw new Error("Failed to create invitation");
  }
  return response.json();
}

export async function generateFakeEvents(
  count: number,
  token: string,
): Promise<Incident[]> {
  const response = await fetch(`${API_BASE_URL}/api/simulator/events?count=${count}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to generate fake events");
  }
  return response.json();
}

export async function fetchSimulatorSettings(
  token: string,
): Promise<SimulatorSettings> {
  const response = await fetch(`${API_BASE_URL}/api/simulator/settings`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch simulator settings");
  }
  return response.json();
}

export async function updateSimulatorSettings(
  settings: { interval_seconds?: number; is_enabled?: boolean },
  token: string,
): Promise<SimulatorSettings> {
  const response = await fetch(`${API_BASE_URL}/api/simulator/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("Failed to update simulator settings");
  }
  return response.json();
}

export async function notifyResponders(
  incidentId: string,
  recipientRole: "police" | "fire_fighter",
  message: string,
  token: string,
): Promise<Notification> {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ recipient_role: recipientRole, message }),
  });
  if (!response.ok) {
    throw new Error("Failed to notify responders");
  }
  return response.json();
}

export async function createIncidentReport(
  incidentId: string,
  actionTaken: string,
  notes: string,
  status: Status,
  token: string,
) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ action_taken: actionTaken, notes, status }),
  });
  if (!response.ok) {
    throw new Error("Failed to submit report");
  }
  return response.json();
}

export async function fetchNotifications(token: string): Promise<Notification[]> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}
