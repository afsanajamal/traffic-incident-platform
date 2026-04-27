import logging
import os
import time

from simulator.client import IncidentApiClient
from simulator.event_factory import build_event


logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def run_once(client: IncidentApiClient, batch_size: int = 5) -> None:
    for _ in range(batch_size):
        client.post_incident(build_event())


def run_continuous(client: IncidentApiClient, fallback_interval_seconds: float) -> None:
    while True:
        settings = client.get_settings(fallback_interval_seconds)
        if settings["is_enabled"]:
            client.post_incident(build_event())
        else:
            logging.info("fake event generation is stopped")

        interval_seconds = settings["interval_seconds"]
        logging.info("waiting %.0f seconds before next generated event", interval_seconds)
        time.sleep(interval_seconds)


def main() -> None:
    api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    fallback_api_base_url = os.getenv("FALLBACK_API_BASE_URL")
    interval_seconds = float(os.getenv("INTERVAL_SECONDS", "120"))
    run_mode = os.getenv("RUN_MODE", "continuous")
    batch_size = int(os.getenv("BATCH_SIZE", "5"))

    client = IncidentApiClient(api_base_url, fallback_base_url=fallback_api_base_url)

    if run_mode == "once":
        run_once(client, batch_size=batch_size)
    else:
        run_continuous(client, fallback_interval_seconds=interval_seconds)


if __name__ == "__main__":
    main()
