import httpx

from simulator.client import IncidentApiClient


def test_client_handles_api_failure(monkeypatch) -> None:
    def raise_error(*args, **kwargs):
        raise httpx.ConnectError("connection failed")

    monkeypatch.setattr(httpx, "post", raise_error)

    assert IncidentApiClient("http://api:8000").post_incident({}) is False
