"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, PauseCircle, PlayCircle } from "lucide-react";
import { AuthPanel } from "../components/AuthPanel";
import { IncidentDetailPanel } from "../components/IncidentDetailPanel";
import { IncidentFilters } from "../components/IncidentFilters";
import { IncidentTable } from "../components/IncidentTable";
import { LiveConnectionIndicator } from "../components/LiveConnectionIndicator";
import { SimulatorControlPanel } from "../components/SimulatorControlPanel";
import { UserAdminPanel } from "../components/UserAdminPanel";
import {
  fetchCurrentUser,
  fetchIncidents,
  fetchNotifications,
  fetchSimulatorSettings,
  updateSimulatorSettings,
} from "../lib/api";
import { connectIncidentSocket } from "../lib/websocket";
import type {
  AuthResponse,
  Incident,
  IncidentFilters as Filters,
  Notification,
  SimulatorSettings,
  User,
} from "../lib/types";

const defaultFilters: Filters = {
  severity: "",
  type: "",
  status: "",
  from: "",
  to: "",
  sort: "-detected_at",
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [simulatorSettings, setSimulatorSettings] =
    useState<SimulatorSettings | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  const loadIncidents = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setError(null);
      const data = await fetchIncidents(filters, token);
      setIncidents(data.items);
      setTotal(data.total);
      setSelectedId((current) => current ?? data.items[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    }
  }, [filters, token]);

  const loadNotifications = useCallback(async () => {
    if (!token || !user || !["police", "fire_fighter"].includes(user.role)) {
      return;
    }
    setNotifications(await fetchNotifications(token));
  }, [token, user]);

  const loadSimulatorSettings = useCallback(async () => {
    if (!token || user?.role !== "super_admin") {
      return;
    }
    setSimulatorSettings(await fetchSimulatorSettings(token));
  }, [token, user]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("trafficIncidentToken");
    if (!savedToken) {
      return;
    }
    fetchCurrentUser(savedToken)
      .then((currentUser) => {
        setToken(savedToken);
        setUser(currentUser);
      })
      .catch(() => window.localStorage.removeItem("trafficIncidentToken"));
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadSimulatorSettings();
  }, [loadSimulatorSettings]);

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

  const authenticated = (auth: AuthResponse) => {
    window.localStorage.setItem("trafficIncidentToken", auth.access_token);
    setToken(auth.access_token);
    setUser(auth.user);
  };

  const logout = () => {
    window.localStorage.removeItem("trafficIncidentToken");
    setToken(null);
    setUser(null);
    setIncidents([]);
    setNotifications([]);
  };

  const toggleFakeEvents = async () => {
    if (!token) {
      return;
    }
    const nextEnabled = !(simulatorSettings?.is_enabled ?? true);
    setSimulatorSettings(
      await updateSimulatorSettings({ is_enabled: nextEnabled }, token),
    );
  };

  if (!token || !user) {
    return <AuthPanel onAuthenticated={authenticated} />;
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <h1>Traffic Incidents</h1>
          <p>
            {total} active records | {user.full_name} | {user.role.replace("_", " ")}
          </p>
        </div>
        <div className="topbar-actions">
          {user.role === "super_admin" ? (
            <button type="button" onClick={toggleFakeEvents}>
              {simulatorSettings?.is_enabled ?? true ? (
                <PauseCircle size={16} />
              ) : (
                <PlayCircle size={16} />
              )}
              <span>
                {simulatorSettings?.is_enabled ?? true
                  ? "Stop fake events"
                  : "Generate fake events"}
              </span>
            </button>
          ) : null}
          <LiveConnectionIndicator connected={connected} />
          <button className="icon-button" type="button" onClick={logout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {user.role === "super_admin" ? (
        <>
          <SimulatorControlPanel token={token} />
          <UserAdminPanel token={token} />
        </>
      ) : null}

      {notifications.length > 0 ? (
        <section className="notification-strip">
          {notifications.slice(0, 3).map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => setSelectedId(notification.incident_id)}
            >
              {notification.message}
            </button>
          ))}
        </section>
      ) : null}

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
        <IncidentDetailPanel
          incident={selectedIncident}
          token={token}
          user={user}
          onUpdated={updateIncident}
        />
      </section>
    </main>
  );
}
