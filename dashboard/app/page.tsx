"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IncidentDetailPanel } from "../components/IncidentDetailPanel";
import { IncidentFilters } from "../components/IncidentFilters";
import { IncidentTable } from "../components/IncidentTable";
import { LiveConnectionIndicator } from "../components/LiveConnectionIndicator";
import { fetchIncidents } from "../lib/api";
import { connectIncidentSocket } from "../lib/websocket";
import type { Incident, IncidentFilters as Filters } from "../lib/types";

const defaultFilters: Filters = {
  severity: "",
  type: "",
  status: "",
  from: "",
  to: "",
  sort: "-detected_at",
};

export default function Home() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  const loadIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchIncidents(filters);
      setIncidents(data.items);
      setTotal(data.total);
      setSelectedId((current) => current ?? data.items[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    }
  }, [filters]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    return connectIncidentSocket(
      (message) => {
        setIncidents((current) => {
          if (current.some((incident) => incident.id === message.data.id)) {
            return current;
          }
          return [message.data, ...current].slice(0, 50);
        });
        setSelectedId((current) => current ?? message.data.id);
      },
      setConnected,
    );
  }, []);

  const updateIncident = (updated: Incident) => {
    setIncidents((current) =>
      current.map((incident) => (incident.id === updated.id ? updated : incident)),
    );
  };

  return (
    <main>
      <header className="topbar">
        <div>
          <h1>Traffic Incidents</h1>
          <p>{total} active records from detection events</p>
        </div>
        <LiveConnectionIndicator connected={connected} />
      </header>

      <IncidentFilters
        filters={filters}
        onChange={setFilters}
        onRefresh={loadIncidents}
      />

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace">
        <IncidentTable
          incidents={incidents}
          selectedId={selectedId}
          onSelect={(incident) => setSelectedId(incident.id)}
        />
        <IncidentDetailPanel incident={selectedIncident} onUpdated={updateIncident} />
      </section>
    </main>
  );
}
