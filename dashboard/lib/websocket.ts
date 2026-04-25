import type { IncidentCreatedMessage } from "./types";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

export function connectIncidentSocket(
  onIncidentCreated: (message: IncidentCreatedMessage) => void,
  onStateChange: (connected: boolean) => void,
): () => void {
  const socket = new WebSocket(`${WS_BASE_URL}/ws/incidents`);

  socket.onopen = () => onStateChange(true);
  socket.onclose = () => onStateChange(false);
  socket.onerror = () => onStateChange(false);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as IncidentCreatedMessage;
    if (message.event === "incident.created") {
      onIncidentCreated(message);
    }
  };

  return () => socket.close();
}
