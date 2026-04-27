import { CheckCircle2, CircleSlash, Eye, XCircle } from "lucide-react";
import {
  createIncidentReport,
  notifyResponders,
  updateIncidentStatus,
} from "../lib/api";
import type { Incident, Status, User } from "../lib/types";
import { Button } from "./ui/button";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  incident: Incident | null;
  token: string;
  user: User;
  onUpdated: (incident: Incident) => void;
};

const statusActions: { status: Status; label: string; icon: React.ReactNode }[] = [
  { status: "acknowledged", label: "Acknowledge", icon: <Eye size={16} /> },
  { status: "resolved", label: "Resolve", icon: <CheckCircle2 size={16} /> },
  { status: "dismissed", label: "Dismiss", icon: <XCircle size={16} /> },
];

export function IncidentDetailPanel({ incident, token, user, onUpdated }: Props) {
  const canUpdateStatus = ["super_admin", "police", "fire_fighter"].includes(user.role);
  const canNotify = ["super_admin", "traffic_monitor"].includes(user.role);
  const canReport = ["super_admin", "police", "fire_fighter"].includes(user.role);

  if (!incident) {
    return (
      <aside className="flex items-center justify-center gap-2 border-l bg-card p-5 text-sm text-muted-foreground">
        <CircleSlash size={24} aria-hidden="true" />
        <span>Select an incident</span>
      </aside>
    );
  }

  const updateStatus = async (status: Status) => {
    const updated = await updateIncidentStatus(incident.id, status, token);
    onUpdated(updated);
  };

  const notify = async (recipientRole: "police" | "fire_fighter") => {
    await notifyResponders(
      incident.id,
      recipientRole,
      `${incident.severity.toUpperCase()} incident needs review: ${incident.title}`,
      token,
    );
  };

  const submitReport = async (status: Status) => {
    await createIncidentReport(
      incident.id,
      `Responder updated incident to ${status}`,
      `Action recorded by ${user.full_name}.`,
      status,
      token,
    );
    const updated = await updateIncidentStatus(incident.id, status, token);
    onUpdated(updated);
  };

  return (
    <aside className="border-l bg-card p-5">
      <div className="flex justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{incident.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{incident.location_name}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
      </div>

      {incident.image_url ? (
        <img
          className="my-5 h-[210px] w-full rounded-md border object-cover"
          src={incident.image_url}
          alt=""
        />
      ) : (
        <div className="my-5 flex h-[210px] w-full items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
          No image
        </div>
      )}

      <p className="text-sm leading-6 text-slate-700">{incident.description}</p>

      <dl className="my-5 grid grid-cols-2 gap-3">
        <div><dt className="mb-1 text-xs text-muted-foreground">Type</dt><dd className="text-sm">{incident.type.replaceAll("_", " ")}</dd></div>
        <div><dt className="mb-1 text-xs text-muted-foreground">Camera</dt><dd className="text-sm">{incident.camera_name}</dd></div>
        <div><dt className="mb-1 text-xs text-muted-foreground">Confidence</dt><dd className="text-sm">{Math.round(incident.confidence * 100)}%</dd></div>
        <div><dt className="mb-1 text-xs text-muted-foreground">Coordinates</dt><dd className="text-sm">{incident.latitude}, {incident.longitude}</dd></div>
        <div><dt className="mb-1 text-xs text-muted-foreground">Detected</dt><dd className="text-sm">{new Date(incident.detected_at).toLocaleString()}</dd></div>
        <div><dt className="mb-1 text-xs text-muted-foreground">Updated</dt><dd className="text-sm">{new Date(incident.updated_at).toLocaleString()}</dd></div>
      </dl>

      {canUpdateStatus ? (
        <div className="grid grid-cols-3 gap-2">
          {statusActions.map((action) => (
            <Button
              variant="outline"
              key={action.status}
              type="button"
              onClick={() => updateStatus(action.status)}
              disabled={incident.status === action.status}
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      ) : null}

      {canNotify ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" type="button" onClick={() => notify("police")}>Notify police</Button>
          <Button variant="secondary" type="button" onClick={() => notify("fire_fighter")}>Notify fire</Button>
        </div>
      ) : null}

      {canReport ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" type="button" onClick={() => submitReport("acknowledged")}>
            Report acknowledged
          </Button>
          <Button variant="secondary" type="button" onClick={() => submitReport("resolved")}>
            Report resolved
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
