import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.incidents.domain import IncidentType, Severity, Status
from app.incidents.repository import IncidentRepository
from app.incidents.schemas import (
    IncidentCreate,
    IncidentList,
    IncidentRead,
    IncidentStatusUpdate,
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
) -> IncidentRead:
    try:
        return service.update_status(incident_id, update.status)
    except IncidentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Incident not found") from exc


@router.websocket("/ws/incidents")
async def incident_websocket(websocket: WebSocket) -> None:
    await connection_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
