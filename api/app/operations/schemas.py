import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.auth.domain import UserRole
from app.incidents.domain import Status


class NotificationCreate(BaseModel):
    recipient_role: UserRole
    message: str = Field(min_length=1, max_length=1000)


class NotificationRead(NotificationCreate):
    id: uuid.UUID
    incident_id: uuid.UUID
    created_by_id: uuid.UUID
    read_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportCreate(BaseModel):
    action_taken: str = Field(min_length=1, max_length=200)
    notes: str = Field(min_length=1, max_length=3000)
    status: Status | None = None


class ReportRead(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    author_id: uuid.UUID
    responder_role: UserRole
    action_taken: str
    notes: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
