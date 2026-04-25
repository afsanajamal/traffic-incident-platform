import uuid
from datetime import datetime

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from app.incidents.domain import IncidentType, Severity, Status
from app.incidents.model import Incident
from app.incidents.schemas import IncidentCreate, SortOption


class IncidentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: IncidentCreate) -> Incident:
        incident = Incident(**data.model_dump(), status=Status.NEW)
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def list(
        self,
        *,
        incident_type: IncidentType | None = None,
        severity: Severity | None = None,
        status: Status | None = None,
        camera_id: str | None = None,
        detected_from: datetime | None = None,
        detected_to: datetime | None = None,
        sort: SortOption = "-detected_at",
        page: int = 1,
        page_size: int = 25,
    ) -> tuple[list[Incident], int]:
        statement = self._filtered_query(
            incident_type=incident_type,
            severity=severity,
            status=status,
            camera_id=camera_id,
            detected_from=detected_from,
            detected_to=detected_to,
        )
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0

        statement = self._apply_sort(statement, sort)
        statement = statement.offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(statement).all()), total

    def get(self, incident_id: uuid.UUID) -> Incident | None:
        return self.db.get(Incident, incident_id)

    def update_status(self, incident: Incident, status: Status) -> Incident:
        incident.status = status
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def _filtered_query(
        self,
        *,
        incident_type: IncidentType | None,
        severity: Severity | None,
        status: Status | None,
        camera_id: str | None,
        detected_from: datetime | None,
        detected_to: datetime | None,
    ) -> Select[tuple[Incident]]:
        statement = select(Incident)
        if incident_type is not None:
            statement = statement.where(Incident.type == incident_type)
        if severity is not None:
            statement = statement.where(Incident.severity == severity)
        if status is not None:
            statement = statement.where(Incident.status == status)
        if camera_id is not None:
            statement = statement.where(Incident.camera_id == camera_id)
        if detected_from is not None:
            statement = statement.where(Incident.detected_at >= detected_from)
        if detected_to is not None:
            statement = statement.where(Incident.detected_at <= detected_to)
        return statement

    def _apply_sort(
        self, statement: Select[tuple[Incident]], sort: SortOption
    ) -> Select[tuple[Incident]]:
        descending = sort.startswith("-")
        field = sort.removeprefix("-")

        if field == "severity":
            severity_rank = case(
                (Incident.severity == Severity.LOW, 1),
                (Incident.severity == Severity.MEDIUM, 2),
                (Incident.severity == Severity.HIGH, 3),
                (Incident.severity == Severity.CRITICAL, 4),
                else_=0,
            )
            order_column = severity_rank
        elif field == "created_at":
            order_column = Incident.created_at
        else:
            order_column = Incident.detected_at

        if descending:
            order_column = order_column.desc()
        return statement.order_by(order_column, Incident.created_at.desc())
