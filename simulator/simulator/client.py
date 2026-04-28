import logging

import httpx

logger = logging.getLogger(__name__)


class IncidentApiClient:
    def __init__(self, base_url: str, fallback_base_url: str | None = None) -> None:
        self.base_urls = [base_url.rstrip("/")]
        if fallback_base_url:
            fallback_base_url = fallback_base_url.rstrip("/")
            if fallback_base_url not in self.base_urls:
                self.base_urls.append(fallback_base_url)

    def post_incident(self, payload: dict) -> bool:
        for base_url in self.base_urls:
            try:
                response = httpx.post(
                    f"{base_url}/api/incidents", json=payload, timeout=10
                )
                response.raise_for_status()
                logger.info("created incident %s via %s", response.json().get("id"), base_url)
                return True
            except httpx.HTTPError as exc:
                logger.warning("failed to create incident via %s: %s", base_url, exc)
        return False

    def get_settings(self, fallback_interval_seconds: float) -> dict:
        for base_url in self.base_urls:
            try:
                response = httpx.get(
                    f"{base_url}/api/simulator/settings", timeout=5
                )
                response.raise_for_status()
                data = response.json()
                return {
                    "interval_seconds": float(data["interval_seconds"]),
                    "is_enabled": bool(data["is_enabled"]),
                }
            except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
                logger.warning("failed to fetch simulator settings via %s: %s", base_url, exc)
        return {
            "interval_seconds": fallback_interval_seconds,
            "is_enabled": True,
            }
