import type { Incident, IncidentFilters, IncidentList, Status } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchIncidents(
  filters: IncidentFilters,
): Promise<IncidentList> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/incidents?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch incidents");
  }

  return response.json();
}

export async function updateIncidentStatus(
  incidentId: string,
  status: Status,
): Promise<Incident> {
  const response = await fetch(
    `${API_BASE_URL}/api/incidents/${incidentId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update incident status");
  }

  return response.json();
}
