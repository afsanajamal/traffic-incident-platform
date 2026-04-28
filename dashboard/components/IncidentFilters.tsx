import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { IncidentFilters as Filters } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
    <section
      className="border-b bg-card px-6 py-5"
      aria-label="Incident filters"
    >
      <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[repeat(6,minmax(150px,1fr))_auto]">
        <FilterField label="Severity">
          <Select value={filters.severity || "all"} onValueChange={(value) => update("severity", value === "all" || value == null ? "" : value)}>
            <SelectTrigger className="h-10 w-full rounded-lg bg-background">
              <SelectValue placeholder="All severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Incident type">
          <Select value={filters.type || "all"} onValueChange={(value) => update("type", value === "all" || value == null ? "" : value)}>
            <SelectTrigger className="h-10 w-full rounded-lg bg-background">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="stopped_vehicle">Stopped vehicle</SelectItem>
              <SelectItem value="debris">Debris</SelectItem>
              <SelectItem value="congestion">Congestion</SelectItem>
              <SelectItem value="wrong_way_driver">Wrong-way driver</SelectItem>
              <SelectItem value="pedestrian">Pedestrian</SelectItem>
              <SelectItem value="accident">Accident</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Status">
          <Select value={filters.status || "all"} onValueChange={(value) => update("status", value === "all" || value == null ? "" : value)}>
            <SelectTrigger className="h-10 w-full rounded-lg bg-background">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Detected from">
          <Input
            className="h-10 rounded-lg bg-background"
            type="datetime-local"
            value={filters.from}
            onChange={(e) => update("from", e.target.value)}
            aria-label="Detected from"
          />
        </FilterField>

        <FilterField label="Detected to">
          <Input
            className="h-10 rounded-lg bg-background"
            type="datetime-local"
            value={filters.to}
            onChange={(e) => update("to", e.target.value)}
            aria-label="Detected to"
          />
        </FilterField>

        <FilterField label="Sort">
          <Select value={filters.sort} onValueChange={(value) => value && update("sort", value)}>
            <SelectTrigger className="h-10 w-full rounded-lg bg-background">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-detected_at">Newest detected</SelectItem>
              <SelectItem value="detected_at">Oldest detected</SelectItem>
              <SelectItem value="-severity">Highest severity</SelectItem>
              <SelectItem value="severity">Lowest severity</SelectItem>
              <SelectItem value="-created_at">Newest created</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <div className="flex gap-2">
          <Button type="button" onClick={onRefresh} title="Search incidents" className="h-10 w-10 p-0">
            <Search size={18} aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" type="button" onClick={onRefresh} title="Refresh">
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" type="button" title="Filter options">
            <SlidersHorizontal size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
