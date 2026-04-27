import { CheckCircle2, CircleSlash, Eye, XCircle } from "lucide-react";
import {
  createIncidentReport,
  notifyResponders,
  updateIncidentStatus,
} from "../lib/api";
import type { Incident, Status, User } from "../lib/types";
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
      <aside className="detail-panel empty-detail">
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
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <h2>{incident.title}</h2>
          <p>{incident.location_name}</p>
        </div>
        <div className="badge-row">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
      </div>

      {incident.image_url ? (
        <img className="snapshot" src={incident.image_url} alt="" />
      ) : (
        <div className="snapshot placeholder">No image</div>
      )}

      <p className="description">{incident.description}</p>

      <dl className="detail-grid">
        <div><dt>Type</dt><dd>{incident.type.replaceAll("_", " ")}</dd></div>
        <div><dt>Camera</dt><dd>{incident.camera_name}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(incident.confidence * 100)}%</dd></div>
        <div><dt>Coordinates</dt><dd>{incident.latitude}, {incident.longitude}</dd></div>
        <div><dt>Detected</dt><dd>{new Date(incident.detected_at).toLocaleString()}</dd></div>
        <div><dt>Updated</dt><dd>{new Date(incident.updated_at).toLocaleString()}</dd></div>
      </dl>

      {canUpdateStatus ? (
        <div className="actions">
          {statusActions.map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => updateStatus(action.status)}
              disabled={incident.status === action.status}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {canNotify ? (
        <div className="actions responder-actions">
          <button type="button" onClick={() => notify("police")}>Notify police</button>
          <button type="button" onClick={() => notify("fire_fighter")}>Notify fire</button>
        </div>
      ) : null}

      {canReport ? (
        <div className="actions responder-actions">
          <button type="button" onClick={() => submitReport("acknowledged")}>
            Report acknowledged
          </button>
          <button type="button" onClick={() => submitReport("resolved")}>
            Report resolved
          </button>
        </div>
      ) : null}
    </aside>
  );
}
