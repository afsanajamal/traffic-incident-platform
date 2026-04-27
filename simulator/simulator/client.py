import logging

import httpx

logger = logging.getLogger(__name__)


class IncidentApiClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def post_incident(self, payload: dict) -> bool:
        try:
            response = httpx.post(
                f"{self.base_url}/api/incidents", json=payload, timeout=10
            )
            response.raise_for_status()
            logger.info("created incident %s", response.json().get("id"))
            return True
        except httpx.HTTPError as exc:
            logger.warning("failed to create incident: %s", exc)
            return False

    def get_settings(self, fallback_interval_seconds: float) -> dict:
        try:
            response = httpx.get(
                f"{self.base_url}/api/simulator/settings", timeout=5
            )
            response.raise_for_status()
            data = response.json()
            return {
                "interval_seconds": float(data["interval_seconds"]),
                "is_enabled": bool(data["is_enabled"]),
            }
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            logger.warning("failed to fetch simulator settings: %s", exc)
            return {
                "interval_seconds": fallback_interval_seconds,
                "is_enabled": True,
            }
