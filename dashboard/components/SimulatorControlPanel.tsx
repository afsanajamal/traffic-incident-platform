import { FormEvent, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import {
  fetchSimulatorSettings,
  updateSimulatorSettings,
} from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
    <section className="border-b bg-card px-6 py-3">
      <form className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_120px]" onSubmit={submit}>
        <div>
          <strong className="block text-sm font-semibold">Simulator interval</strong>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Current: every {savedInterval} seconds
          </span>
        </div>
        <Input
          type="number"
          min={10}
          max={3600}
          step={10}
          value={intervalSeconds}
          onChange={(event) => setIntervalSeconds(Number(event.target.value))}
          aria-label="Simulator interval seconds"
        />
        <Button type="submit">
          <Clock size={16} />
          <span>Save timer</span>
        </Button>
      </form>
      {error ? (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
