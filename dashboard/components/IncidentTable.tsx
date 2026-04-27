import type { Incident } from "../lib/types";
import { cn } from "../lib/utils";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (incident: Incident) => void;
};

export function IncidentTable({ incidents, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-auto">
      <table className="min-w-[820px] w-full border-collapse">
        <thead>
          <tr>
            <th className="h-10 border-b bg-muted px-4 text-left text-xs font-semibold uppercase text-muted-foreground">Incident</th>
            <th className="h-10 border-b bg-muted px-4 text-left text-xs font-semibold uppercase text-muted-foreground">Severity</th>
            <th className="h-10 border-b bg-muted px-4 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
            <th className="h-10 border-b bg-muted px-4 text-left text-xs font-semibold uppercase text-muted-foreground">Camera</th>
            <th className="h-10 border-b bg-muted px-4 text-left text-xs font-semibold uppercase text-muted-foreground">Detected</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className={cn(
                "cursor-pointer border-b bg-card transition-colors hover:bg-accent/60",
                incident.id === selectedId && "bg-accent",
              )}
              onClick={() => onSelect(incident)}
            >
              <td className="px-4 py-3 align-middle text-sm">
                <strong className="block font-semibold">{incident.title}</strong>
                <span className="block text-xs text-muted-foreground">{incident.location_name}</span>
              </td>
              <td className="px-4 py-3 align-middle text-sm"><SeverityBadge severity={incident.severity} /></td>
              <td className="px-4 py-3 align-middle text-sm"><StatusBadge status={incident.status} /></td>
              <td className="px-4 py-3 align-middle text-sm">{incident.camera_id}</td>
              <td className="px-4 py-3 align-middle text-sm">{new Date(incident.detected_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {incidents.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">No incidents found.</div>
      ) : null}
    </div>
  );
}
