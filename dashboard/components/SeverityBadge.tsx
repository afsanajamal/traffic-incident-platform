import type { Severity } from "../lib/types";
import { Badge } from "./ui/badge";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const classNameBySeverity = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    high: "bg-orange-50 text-orange-800 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
  } as const;

  return (
    <Badge variant="outline" className={classNameBySeverity[severity]}>
      {severity}
    </Badge>
  );
}
