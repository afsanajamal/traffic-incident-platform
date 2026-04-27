import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.auth.domain import UserRole
from app.auth.model import User
from app.core.database import get_session
from app.incidents.model import Incident
from app.operations.model import IncidentNotification, IncidentReport
from app.operations.schemas import (
    NotificationCreate,
    NotificationRead,
    ReportCreate,
    ReportRead,
)


router = APIRouter()


@router.post(
    "/api/incidents/{incident_id}/notifications",
    response_model=NotificationRead,
    status_code=201,
)
def notify_responders(
    incident_id: uuid.UUID,
    payload: NotificationCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.TRAFFIC_MONITOR)
    ),
) -> IncidentNotification:
    if payload.recipient_role not in {UserRole.POLICE, UserRole.FIRE_FIGHTER}:
        raise HTTPException(status_code=400, detail="Can only notify responder roles")
    if db.get(Incident, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    notification = IncidentNotification(
        incident_id=incident_id,
        recipient_role=payload.recipient_role,
        message=payload.message,
        created_by_id=current_user.id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.get("/api/notifications", response_model=list[NotificationRead])
def list_my_notifications(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[IncidentNotification]:
    return list(
        db.scalars(
            select(IncidentNotification)
            .where(IncidentNotification.recipient_role == current_user.role)
            .order_by(IncidentNotification.created_at.desc())
        ).all()
    )


@router.post(
    "/api/incidents/{incident_id}/reports",
    response_model=ReportRead,
    status_code=201,
)
def create_report(
    incident_id: uuid.UUID,
    payload: ReportCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.POLICE, UserRole.FIRE_FIGHTER)
    ),
) -> IncidentReport:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    report = IncidentReport(
        incident_id=incident_id,
        author_id=current_user.id,
        responder_role=current_user.role,
        action_taken=payload.action_taken,
        notes=payload.notes,
    )
    if payload.status is not None:
        incident.status = payload.status
        db.add(incident)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/api/incidents/{incident_id}/reports", response_model=list[ReportRead])
def list_reports(
    incident_id: uuid.UUID,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[IncidentReport]:
    if db.get(Incident, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return list(
        db.scalars(
            select(IncidentReport)
            .where(IncidentReport.incident_id == incident_id)
            .order_by(IncidentReport.created_at.desc())
        ).all()
    )
