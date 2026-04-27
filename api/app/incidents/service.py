import uuid
from datetime import datetime

from app.incidents.domain import IncidentType, Severity, Status
from app.incidents.model import Incident
from app.incidents.repository import IncidentRepository
from app.incidents.schemas import (
    IncidentCreate,
    IncidentList,
    IncidentRead,
    IncidentUpdate,
    SortOption,
)
from app.realtime.connection_manager import ConnectionManager


class IncidentNotFoundError(Exception):
    pass


class IncidentService:
    def __init__(
        self, repository: IncidentRepository, connection_manager: ConnectionManager
    ) -> None:
        self.repository = repository
        self.connection_manager = connection_manager

    async def create(self, data: IncidentCreate) -> IncidentRead:
        incident = self.repository.create(data)
        incident_read = self._to_read(incident)
        await self.connection_manager.broadcast(
            {"event": "incident.created", "data": incident_read.model_dump(mode="json")}
        )
        return incident_read

    def list(
        self,
        *,
        incident_type: IncidentType | None,
        severity: Severity | None,
        status: Status | None,
        camera_id: str | None,
        detected_from: datetime | None,
        detected_to: datetime | None,
        sort: SortOption,
        page: int,
        page_size: int,
    ) -> IncidentList:
        incidents, total = self.repository.list(
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
        return IncidentList(
            items=[self._to_read(incident) for incident in incidents],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get(self, incident_id: uuid.UUID) -> IncidentRead:
        incident = self.repository.get(incident_id)
        if incident is None:
            raise IncidentNotFoundError
        return self._to_read(incident)

    def update_status(self, incident_id: uuid.UUID, status: Status) -> IncidentRead:
        incident = self.repository.get(incident_id)
        if incident is None:
            raise IncidentNotFoundError
        return self._to_read(self.repository.update_status(incident, status))

    def update(self, incident_id: uuid.UUID, data: IncidentUpdate) -> IncidentRead:
        incident = self.repository.get(incident_id)
        if incident is None:
            raise IncidentNotFoundError
        return self._to_read(self.repository.update(incident, data))

    def delete(self, incident_id: uuid.UUID) -> None:
        incident = self.repository.get(incident_id)
        if incident is None:
            raise IncidentNotFoundError
        self.repository.delete(incident)

    def _to_read(self, incident: Incident) -> IncidentRead:
        return IncidentRead.model_validate(incident)
