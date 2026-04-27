import { FormEvent, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import {
  fetchSimulatorSettings,
  updateSimulatorSettings,
} from "../lib/api";

type Props = {
  token: string;
};

export function SimulatorControlPanel({ token }: Props) {
  const [intervalSeconds, setIntervalSeconds] = useState(120);
  const [savedInterval, setSavedInterval] = useState(120);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulatorSettings(token)
      .then((settings) => {
        setIntervalSeconds(settings.interval_seconds);
        setSavedInterval(settings.interval_seconds);
      })
      .catch(() => setError("Failed to load simulator settings"));
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      const settings = await updateSimulatorSettings(
        { interval_seconds: intervalSeconds },
        token,
      );
      setIntervalSeconds(settings.interval_seconds);
      setSavedInterval(settings.interval_seconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save simulator settings");
    }
  };

  return (
    <section className="simulator-panel">
      <form onSubmit={submit}>
        <div>
          <strong>Simulator interval</strong>
          <span>Current: every {savedInterval} seconds</span>
        </div>
        <input
          type="number"
          min={10}
          max={3600}
          step={10}
          value={intervalSeconds}
          onChange={(event) => setIntervalSeconds(Number(event.target.value))}
          aria-label="Simulator interval seconds"
        />
        <button type="submit">
          <Clock size={16} />
          <span>Save timer</span>
        </button>
      </form>
      {error ? <div className="form-error">{error}</div> : null}
    </section>
  );
}
