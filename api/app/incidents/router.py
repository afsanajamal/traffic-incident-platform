import uuid
from datetime import UTC, datetime
import random
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.domain import UserRole
from app.auth.model import User
from app.core.database import get_session
from app.incidents.domain import IncidentType, Severity, Status
from app.incidents.repository import IncidentRepository
from app.incidents.schemas import (
    IncidentCreate,
    IncidentBulkDelete,
    IncidentBulkDeleteResult,
    IncidentList,
    IncidentRead,
    IncidentStatusUpdate,
    IncidentUpdate,
    SortOption,
)
from app.incidents.service import IncidentNotFoundError, IncidentService
from app.realtime.connection_manager import ConnectionManager


router = APIRouter()
connection_manager = ConnectionManager()


def get_incident_service(db: Session = Depends(get_session)) -> IncidentService:
    return IncidentService(IncidentRepository(db), connection_manager)


@router.post("/api/incidents", response_model=IncidentRead, status_code=201)
async def create_incident(
    incident: IncidentCreate,
    service: IncidentService = Depends(get_incident_service),
) -> IncidentRead:
    return await service.create(incident)


@router.get("/api/incidents", response_model=IncidentList)
def list_incidents(
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
    incident_type: Annotated[IncidentType | None, Query(alias="type")] = None,
    severity: Severity | None = None,
    status: Status | None = None,
    camera_id: str | None = None,
    detected_from: Annotated[datetime | None, Query(alias="from")] = None,
    detected_to: Annotated[datetime | None, Query(alias="to")] = None,
    sort: SortOption = "-detected_at",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> IncidentList:
    return service.list(
        incident_type=incident_type,
        severity=severity,
        status=status,
        camera_id=camera_id,
        detected_from=detected_from,
        detected_to=detected_to,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/api/incidents/{incident_id}", response_model=IncidentRead)
def get_incident(
    incident_id: uuid.UUID,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
) -> IncidentRead:
    try:
        return service.get(incident_id)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found") from exc


@router.patch("/api/incidents/{incident_id}/status", response_model=IncidentRead)
def update_incident_status(
    incident_id: uuid.UUID,
    update: IncidentStatusUpdate,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
) -> IncidentRead:
    _ensure_role(current_user, UserRole.SUPER_ADMIN, UserRole.POLICE, UserRole.FIRE_FIGHTER)
    try:
        return service.update_status(incident_id, update.status)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found") from exc


@router.patch("/api/incidents/{incident_id}", response_model=IncidentRead)
def update_incident(
    incident_id: uuid.UUID,
    update: IncidentUpdate,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
) -> IncidentRead:
    _ensure_role(current_user, UserRole.SUPER_ADMIN)
    try:
        return service.update(incident_id, update)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found") from exc


@router.delete("/api/incidents/{incident_id}", status_code=204)
def delete_incident(
    incident_id: uuid.UUID,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    _ensure_role(current_user, UserRole.SUPER_ADMIN)
    try:
        service.delete(incident_id)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found") from exc
    return Response(status_code=204)


@router.delete("/api/incidents", response_model=IncidentBulkDeleteResult)
def delete_incidents(
    delete_request: IncidentBulkDelete,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
) -> IncidentBulkDeleteResult:
    _ensure_role(current_user, UserRole.SUPER_ADMIN)
    deleted = service.delete_many(delete_request.incident_ids)
    return IncidentBulkDeleteResult(deleted=deleted)


@router.post("/api/simulator/events", response_model=list[IncidentRead], status_code=201)
async def generate_fake_events(
    count: Annotated[int, Query(ge=1, le=25)] = 1,
    service: IncidentService = Depends(get_incident_service),
    current_user: User = Depends(get_current_user),
) -> list[IncidentRead]:
    _ensure_role(current_user, UserRole.SUPER_ADMIN)
    created: list[IncidentRead] = []
    for _ in range(count):
        created.append(await service.create(_build_fake_incident()))
    return created


@router.websocket("/ws/incidents")
async def incident_websocket(websocket: WebSocket) -> None:
    await connection_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)


def _build_fake_incident() -> IncidentCreate:
    cameras = [
        ("CAM-101", "I-95 South Mile Marker 18", "I-95 Southbound near Exit 18", 39.9402, -75.1698),
        ("CAM-102", "I-95 North Mile Marker 24", "I-95 Northbound near Exit 24", 39.9526, -75.1652),
        ("CAM-203", "Route 1 East Junction", "Route 1 East near Industrial Parkway", 40.0084, -75.1272),
    ]
    incident_type = random.choice(list(IncidentType))
    severity = random.choice(list(Severity))
    camera_id, camera_name, location_name, latitude, longitude = random.choice(cameras)
    confidence = round(random.uniform(0.72, 0.99), 3)
    return IncidentCreate(
        type=incident_type,
        severity=severity,
        title=f"{incident_type.value.replace('_', ' ').title()} at {camera_name}",
        description=(
            f"Generated detection event for {incident_type.value.replace('_', ' ')} "
            f"near {location_name}."
        ),
        camera_id=camera_id,
        camera_name=camera_name,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        image_url=_snapshot_url(),
        confidence=confidence,
        detected_at=datetime.now(UTC),
    )


def _snapshot_url() -> str:
    image_number = random.randint(1, 25)
    return f"http://localhost:3000/snapshots/incident-{image_number:03}.png"


def _ensure_role(current_user: User, *roles: UserRole) -> None:
    if current_user.role not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
