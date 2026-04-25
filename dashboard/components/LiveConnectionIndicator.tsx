import { Radio } from "lucide-react";

export function LiveConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div className={`live-indicator ${connected ? "connected" : "disconnected"}`}>
      <Radio size={16} aria-hidden="true" />
      <span>{connected ? "Live" : "Offline"}</span>
    </div>
  );
}
