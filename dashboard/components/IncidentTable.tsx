import { ArrowDownUp, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Incident } from "../lib/types";
import { cn } from "../lib/utils";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type Props = {
  incidents: Incident[];
  selectedId: string | null;
  canDelete?: boolean;
  selectedIncidentIds?: string[];
  onSelect: (incident: Incident) => void;
  onToggleSelected?: (incidentId: string, checked: boolean) => void;
  onToggleAllSelected?: (checked: boolean) => void;
  onDeleteSelected?: () => void;
};

export function IncidentTable({
  incidents,
  selectedId,
  canDelete = false,
  selectedIncidentIds = [],
  onSelect,
  onToggleSelected,
  onToggleAllSelected,
  onDeleteSelected,
}: Props) {
  const selectedSet = new Set(selectedIncidentIds);
  const allVisibleSelected =
    incidents.length > 0 && incidents.every((incident) => selectedSet.has(incident.id));

  return (
    <div className="border-r bg-background px-6 py-4">
      {canDelete ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {selectedIncidentIds.length} selected
          </p>
          <Button
            variant="destructive"
            type="button"
            disabled={selectedIncidentIds.length === 0}
            onClick={onDeleteSelected}
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>Delete selected</span>
          </Button>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border">
        <Table className={cn(canDelete ? "min-w-[1260px]" : "min-w-[1120px]")}>
          <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
            <TableRow className="hover:bg-muted/70">
              {canDelete ? (
                <TableHead className="w-12 px-4">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    checked={allVisibleSelected}
                    aria-label="Select all visible incidents"
                    onChange={(event) => onToggleAllSelected?.(event.target.checked)}
                  />
                </TableHead>
              ) : null}
              <SortableHead>Status</SortableHead>
              <SortableHead className="min-w-[280px]">Incident</SortableHead>
              <SortableHead>Type</SortableHead>
              <SortableHead>Severity</SortableHead>
              <SortableHead>Camera</SortableHead>
              <SortableHead className="min-w-[180px]">Location</SortableHead>
              <SortableHead>Confidence</SortableHead>
              <SortableHead className="min-w-[190px]">Detected</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {incidents.map((incident) => (
            <TableRow
              key={incident.id}
              data-state={incident.id === selectedId ? "selected" : undefined}
              className={cn(
                "h-14 cursor-pointer bg-background text-muted-foreground",
                "hover:bg-muted/40 data-[state=selected]:bg-muted",
              )}
              onClick={() => onSelect(incident)}
            >
              {canDelete ? (
                <TableCell className="px-4" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    checked={selectedSet.has(incident.id)}
                    aria-label={`Select ${incident.title}`}
                    onChange={(event) =>
                      onToggleSelected?.(incident.id, event.target.checked)
                    }
                  />
                </TableCell>
              ) : null}
              <TableCell className="px-4">
                <StatusBadge status={incident.status} />
              </TableCell>
              <TableCell className="px-4 whitespace-normal">
                <strong className="block font-medium text-foreground">{incident.title}</strong>
                <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                  {incident.description}
                </span>
              </TableCell>
              <TableCell className="px-4 capitalize">{incident.type.replaceAll("_", " ")}</TableCell>
              <TableCell className="px-4">
                <SeverityBadge severity={incident.severity} />
              </TableCell>
              <TableCell className="px-4 font-medium text-foreground">{incident.camera_id}</TableCell>
              <TableCell className="px-4">{incident.location_name}</TableCell>
              <TableCell className="px-4">{Math.round(incident.confidence * 100)}%</TableCell>
              <TableCell className="px-4">{new Date(incident.detected_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>
      {incidents.length === 0 ? (
        <div className="border-t p-8 text-sm text-muted-foreground">No incidents found.</div>
      ) : null}
    </div>
  );
}

function SortableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableHead className={cn("h-12 px-4 text-sm font-semibold text-foreground", className)}>
      <div className="flex items-center gap-2">
        <span>{children}</span>
        <Button
          variant="outline"
          size="icon-xs"
          type="button"
          className="rounded-full bg-background text-muted-foreground"
          title={`Sort by ${children}`}
        >
          <ArrowDownUp size={13} aria-hidden="true" />
        </Button>
      </div>
    </TableHead>
  );
}
