import type { Incident } from "../lib/types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (incident: Incident) => void;
};

export function IncidentTable({ incidents, selectedId, onSelect }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Incident</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Camera</th>
            <th>Detected</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className={incident.id === selectedId ? "selected" : ""}
              onClick={() => onSelect(incident)}
            >
              <td>
                <strong>{incident.title}</strong>
                <span>{incident.location_name}</span>
              </td>
              <td><SeverityBadge severity={incident.severity} /></td>
              <td><StatusBadge status={incident.status} /></td>
              <td>{incident.camera_id}</td>
              <td>{new Date(incident.detected_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {incidents.length === 0 ? <div className="empty-state">No incidents found.</div> : null}
    </div>
  );
}
