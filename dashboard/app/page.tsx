"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogOut, PauseCircle, PlayCircle, PlusCircle } from "lucide-react";
import { AuthPanel } from "../components/AuthPanel";
import {
  DashboardSidebar,
  type DashboardTab,
} from "../components/DashboardSidebar";
import { IncidentDetailPanel } from "../components/IncidentDetailPanel";
import { IncidentFilters } from "../components/IncidentFilters";
import { IncidentTable } from "../components/IncidentTable";
import { LiveConnectionIndicator } from "../components/LiveConnectionIndicator";
import { SimulatorControlPanel } from "../components/SimulatorControlPanel";
import { UserAdminPanel } from "../components/UserAdminPanel";
import { Button } from "../components/ui/button";
import {
  deleteIncidents,
  fetchCurrentUser,
  fetchIncidents,
  fetchNotifications,
  fetchSimulatorSettings,
  generateFakeEvents,
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

const dashboardTabs: DashboardTab[] = [
  "overview",
  "incidents",
  "notifications",
  "simulator",
  "users",
];

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [simulatorSettings, setSimulatorSettings] =
    useState<SimulatorSettings | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const generatingAutoEvent = useRef(false);

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
      setSelectedIncidentIds((current) =>
        current.filter((incidentId) =>
          data.items.some((incident) => incident.id === incidentId),
        ),
      );
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
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && dashboardTabs.includes(tab as DashboardTab)) {
      setActiveTab(tab as DashboardTab);
    }
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
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

  const changeTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const queryString = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${queryString ? `?${queryString}` : ""}`,
    );
  };

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

  const addCreatedIncidents = useCallback((created: Incident[]) => {
    if (created.length === 0) {
      return;
    }
    setIncidents((current) => [
      ...created,
      ...current.filter(
        (incident) => !created.some((newIncident) => newIncident.id === incident.id),
      ),
    ]);
    setSelectedId((current) => current ?? created[0]?.id ?? null);
    setTotal((current) => current + created.length);
  }, []);

  const removeIncidentsFromState = (incidentIds: string[]) => {
    const deletedIds = new Set(incidentIds);
    setIncidents((current) => current.filter((incident) => !deletedIds.has(incident.id)));
    setSelectedIncidentIds((current) =>
      current.filter((incidentId) => !deletedIds.has(incidentId)),
    );
    setSelectedId((current) => {
      if (!current || !deletedIds.has(current)) {
        return current;
      }
      const nextIncident = incidents.find((incident) => !deletedIds.has(incident.id));
      return nextIncident?.id ?? null;
    });
    setTotal((current) => Math.max(0, current - incidentIds.length));
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

  const generateOneFakeEvent = async () => {
    if (!token || user?.role !== "super_admin") {
      return;
    }
    try {
      setError(null);
      const created = await generateFakeEvents(1, token);
      addCreatedIncidents(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate fake event");
    }
  };

  useEffect(() => {
    if (!token || user?.role !== "super_admin" || !simulatorSettings?.is_enabled) {
      return;
    }

    const intervalMs = Math.max(10, simulatorSettings.interval_seconds) * 1000;
    const intervalId = window.setInterval(async () => {
      if (generatingAutoEvent.current) {
        return;
      }
      generatingAutoEvent.current = true;
      try {
        setError(null);
        const created = await generateFakeEvents(1, token);
        addCreatedIncidents(created);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate fake event");
      } finally {
        generatingAutoEvent.current = false;
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [
    addCreatedIncidents,
    simulatorSettings?.interval_seconds,
    simulatorSettings?.is_enabled,
    token,
    user?.role,
  ]);

  const toggleIncidentSelected = (incidentId: string, checked: boolean) => {
    setSelectedIncidentIds((current) => {
      if (checked) {
        return current.includes(incidentId) ? current : [...current, incidentId];
      }
      return current.filter((currentId) => currentId !== incidentId);
    });
  };

  const toggleAllVisibleIncidents = (checked: boolean) => {
    if (!checked) {
      const visibleIds = new Set(incidents.map((incident) => incident.id));
      setSelectedIncidentIds((current) =>
        current.filter((incidentId) => !visibleIds.has(incidentId)),
      );
      return;
    }
    setSelectedIncidentIds((current) => [
      ...current,
      ...incidents
        .map((incident) => incident.id)
        .filter((incidentId) => !current.includes(incidentId)),
    ]);
  };

  const deleteSelectedIncidents = async () => {
    if (!token || user?.role !== "super_admin" || selectedIncidentIds.length === 0) {
      return;
    }
    try {
      setError(null);
      await deleteIncidents(selectedIncidentIds, token);
      removeIncidentsFromState(selectedIncidentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete incidents");
    }
  };

  if (!token || !user) {
    return <AuthPanel onAuthenticated={authenticated} />;
  }

  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <DashboardSidebar
        user={user}
        totalIncidents={total}
        activeTab={activeTab}
        onTabChange={changeTab}
      />
      <div className="min-w-0">
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-6 py-4"
      >
        <div>
          <h1 className="text-2xl font-semibold">Traffic Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} active records | {user.full_name} | {user.role.replace("_", " ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "super_admin" ? (
            <>
              <Button variant="outline" type="button" onClick={generateOneFakeEvent}>
                <PlusCircle size={16} />
                <span>Generate event</span>
              </Button>
              <Button variant="outline" type="button" onClick={toggleFakeEvents}>
                {simulatorSettings?.is_enabled ?? true ? (
                  <PauseCircle size={16} />
                ) : (
                  <PlayCircle size={16} />
                )}
                <span>
                  {simulatorSettings?.is_enabled ?? true
                    ? "Stop fake events"
                    : "Start auto events"}
                </span>
              </Button>
            </>
          ) : null}
          <LiveConnectionIndicator connected={connected} />
          <Button variant="outline" size="icon" type="button" onClick={logout} title="Sign out">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      {activeTab === "overview" ? (
        <>
          {user.role === "super_admin" ? (
            <div>
              <SimulatorControlPanel token={token} />
            </div>
          ) : null}

          {notifications.length > 0 ? (
            <section
              className="flex gap-2 overflow-x-auto border-b border-amber-200 bg-amber-50 px-6 py-2"
            >
              {notifications.slice(0, 3).map((notification) => (
                <Button
                  variant="outline"
                  className="max-w-xl flex-none justify-start overflow-hidden text-ellipsis whitespace-nowrap border-amber-200 text-amber-800"
                  key={notification.id}
                  type="button"
                  onClick={() => setSelectedId(notification.incident_id)}
                >
                  {notification.message}
                </Button>
              ))}
            </section>
          ) : null}

          <IncidentFilters
            filters={filters}
            onChange={setFilters}
            onRefresh={loadIncidents}
          />

          {error ? (
            <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section
            className="grid min-h-[calc(100vh-130px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]"
          >
            <IncidentTable
              incidents={incidents}
              selectedId={selectedId}
              canDelete={user.role === "super_admin"}
              selectedIncidentIds={selectedIncidentIds}
              onSelect={(incident) => setSelectedId(incident.id)}
              onToggleSelected={toggleIncidentSelected}
              onToggleAllSelected={toggleAllVisibleIncidents}
              onDeleteSelected={deleteSelectedIncidents}
            />
            <IncidentDetailPanel
              incident={selectedIncident}
              token={token}
              user={user}
              onUpdated={updateIncident}
            />
          </section>
        </>
      ) : activeTab === "users" && user.role === "super_admin" ? (
        <section className="p-6">
          <div className="rounded-lg border bg-card">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Users & invites</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Invite users by email and assign their platform role.
              </p>
            </div>
            <UserAdminPanel token={token} />
          </div>
        </section>
      ) : (
        <section className="p-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold capitalize">
              {activeTab.replace("_", " ")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This section is ready for the next dashboard update.
            </p>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
