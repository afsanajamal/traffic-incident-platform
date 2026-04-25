import logging
import os
import time

from simulator.client import IncidentApiClient
from simulator.event_factory import build_event


logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def run_once(client: IncidentApiClient, batch_size: int = 5) -> None:
    for _ in range(batch_size):
        client.post_incident(build_event())


def run_continuous(client: IncidentApiClient, interval_seconds: float) -> None:
    while True:
        client.post_incident(build_event())
        time.sleep(interval_seconds)


def main() -> None:
    api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    interval_seconds = float(os.getenv("INTERVAL_SECONDS", "5"))
    run_mode = os.getenv("RUN_MODE", "continuous")
    batch_size = int(os.getenv("BATCH_SIZE", "5"))

    client = IncidentApiClient(api_base_url)

    if run_mode == "once":
        run_once(client, batch_size=batch_size)
    else:
        run_continuous(client, interval_seconds=interval_seconds)


if __name__ == "__main__":
    main()
