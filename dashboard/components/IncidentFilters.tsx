import { RefreshCw } from "lucide-react";
import type { IncidentFilters as Filters } from "../lib/types";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onRefresh: () => void;
};

export function IncidentFilters({ filters, onChange, onRefresh }: Props) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="filters" aria-label="Incident filters">
      <select value={filters.severity} onChange={(e) => update("severity", e.target.value)}>
        <option value="">All severity</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select value={filters.type} onChange={(e) => update("type", e.target.value)}>
        <option value="">All types</option>
        <option value="stopped_vehicle">Stopped vehicle</option>
        <option value="debris">Debris</option>
        <option value="congestion">Congestion</option>
        <option value="wrong_way_driver">Wrong-way driver</option>
        <option value="pedestrian">Pedestrian</option>
        <option value="accident">Accident</option>
        <option value="other">Other</option>
      </select>
      <select value={filters.status} onChange={(e) => update("status", e.target.value)}>
        <option value="">All status</option>
        <option value="new">New</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
      </select>
      <input
        type="datetime-local"
        value={filters.from}
        onChange={(e) => update("from", e.target.value)}
        aria-label="Detected from"
      />
      <input
        type="datetime-local"
        value={filters.to}
        onChange={(e) => update("to", e.target.value)}
        aria-label="Detected to"
      />
      <select value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
        <option value="-detected_at">Newest detected</option>
        <option value="detected_at">Oldest detected</option>
        <option value="-severity">Highest severity</option>
        <option value="severity">Lowest severity</option>
        <option value="-created_at">Newest created</option>
      </select>
      <button className="icon-button" type="button" onClick={onRefresh} title="Refresh">
        <RefreshCw size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
