import uuid
from copy import deepcopy
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_user
from app.auth.domain import UserRole
from app.incidents.domain import Status
from app.incidents.router import get_incident_service
from app.incidents.schemas import IncidentCreate, IncidentList, IncidentRead
from app.incidents.service import IncidentNotFoundError
from app.main import app


def payload() -> dict:
    return {
        "type": "stopped_vehicle",
        "severity": "high",
        "title": "Stopped vehicle detected on I-95 North",
        "description": "Vehicle stopped in a live lane near the right shoulder.",
        "camera_id": "CAM-102",
        "camera_name": "I-95 North Mile Marker 24",
        "location_name": "I-95 Northbound near Exit 24",
        "latitude": 39.9526,
        "longitude": -75.1652,
        "image_url": "https://example.com/snapshots/CAM-102/latest.jpg",
        "confidence": 0.91,
        "detected_at": "2026-04-25T05:42:00Z",
    }


class FakeIncidentService:
    def __init__(self) -> None:
        now = datetime(2026, 4, 25, 5, 43, tzinfo=UTC)
        self.incident = IncidentRead(
            **payload(),
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            status=Status.NEW,
            created_at=now,
            updated_at=now,
        )

    async def create(self, data: IncidentCreate) -> IncidentRead:
        return IncidentRead(
            **data.model_dump(),
            id=self.incident.id,
            status=Status.NEW,
            created_at=self.incident.created_at,
            updated_at=self.incident.updated_at,
        )

    def list(self, **kwargs) -> IncidentList:
        return IncidentList(items=[self.incident], total=1, page=1, page_size=25)

    def get(self, incident_id: uuid.UUID) -> IncidentRead:
        if incident_id != self.incident.id:
            raise IncidentNotFoundError
        return self.incident

    def update_status(self, incident_id: uuid.UUID, status: Status) -> IncidentRead:
        if incident_id != self.incident.id:
            raise IncidentNotFoundError
        return self.incident.model_copy(update={"status": status})


class FakeUser:
    role = UserRole.SUPER_ADMIN


def client() -> TestClient:
    app.dependency_overrides[get_incident_service] = FakeIncidentService
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    return TestClient(app)


def test_health_check() -> None:
    response = client().get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_incident() -> None:
    response = client().post("/api/incidents", json=payload())

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "new"
    assert data["title"] == payload()["title"]
    assert data["id"] == "11111111-1111-1111-1111-111111111111"


def test_reject_invalid_coordinates_and_confidence() -> None:
    invalid_payload = deepcopy(payload())
    invalid_payload["latitude"] = 120
    invalid_payload["confidence"] = 1.4

    response = client().post("/api/incidents", json=invalid_payload)

    assert response.status_code == 422


def test_list_incidents_accepts_filters_and_sort() -> None:
    response = client().get(
        "/api/incidents",
        params={
            "severity": "high",
            "type": "stopped_vehicle",
            "status": "new",
            "sort": "-detected_at",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["camera_id"] == "CAM-102"


def test_get_incident_by_id() -> None:
    response = client().get("/api/incidents/11111111-1111-1111-1111-111111111111")

    assert response.status_code == 200
    assert response.json()["id"] == "11111111-1111-1111-1111-111111111111"


def test_get_missing_incident_returns_404() -> None:
    response = client().get("/api/incidents/22222222-2222-2222-2222-222222222222")

    assert response.status_code == 404


def test_update_incident_status() -> None:
    response = client().patch(
        "/api/incidents/11111111-1111-1111-1111-111111111111/status",
        json={"status": "acknowledged"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "acknowledged"
