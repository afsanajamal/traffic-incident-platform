import { Radio } from "lucide-react";
import { cn } from "../lib/utils";

export function LiveConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm",
        connected ? "text-emerald-700" : "text-red-700",
      )}
    >
      <Radio size={16} aria-hidden="true" />
      <span>{connected ? "Live" : "Offline"}</span>
    </div>
  );
}
