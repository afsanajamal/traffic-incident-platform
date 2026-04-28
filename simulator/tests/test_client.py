import httpx

from simulator.client import IncidentApiClient


def test_client_handles_api_failure(monkeypatch) -> None:
    def raise_error(*args, **kwargs):
        raise httpx.ConnectError("connection failed")

    monkeypatch.setattr(httpx, "post", raise_error)

    assert IncidentApiClient("http://api:8000").post_incident({}) is False


def test_client_uses_fallback_api_for_incident_creation(monkeypatch) -> None:
    calls = []

    def post(url, **kwargs):
        calls.append(url)
        if url.startswith("http://api:8000"):
            raise httpx.ConnectError("connection failed")
        return httpx.Response(201, json={"id": "incident-1"}, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", post)

    assert (
        IncidentApiClient(
            "http://api:8000",
            fallback_base_url="http://host.docker.internal:8000",
        ).post_incident({})
        is True
    )
    assert calls == [
        "http://api:8000/api/incidents",
        "http://host.docker.internal:8000/api/incidents",
    ]


def test_client_uses_fallback_settings_on_api_failure(monkeypatch) -> None:
    def raise_error(*args, **kwargs):
        raise httpx.ConnectError("connection failed")

    monkeypatch.setattr(httpx, "get", raise_error)

    assert IncidentApiClient("http://api:8000").get_settings(120) == {
        "interval_seconds": 120,
        "is_enabled": True,
    }


def test_client_uses_fallback_api_for_settings(monkeypatch) -> None:
    calls = []

    def get(url, **kwargs):
        calls.append(url)
        if url.startswith("http://api:8000"):
            raise httpx.ConnectError("connection failed")
        return httpx.Response(
            200,
            json={"interval_seconds": 10, "is_enabled": False},
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(httpx, "get", get)

    assert IncidentApiClient(
        "http://api:8000",
        fallback_base_url="http://host.docker.internal:8000",
    ).get_settings(120) == {
        "interval_seconds": 10,
        "is_enabled": False,
    }
    assert calls == [
        "http://api:8000/api/simulator/settings",
        "http://host.docker.internal:8000/api/simulator/settings",
    ]
