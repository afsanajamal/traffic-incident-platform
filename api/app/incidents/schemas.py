import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.incidents.domain import IncidentType, Severity, Status


SortOption = Literal[
    "detected_at",
    "-detected_at",
    "created_at",
    "-created_at",
    "severity",
    "-severity",
]


class IncidentCreate(BaseModel):
    type: IncidentType
    severity: Severity
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    camera_id: str = Field(min_length=1, max_length=80)
    camera_name: str = Field(min_length=1, max_length=160)
    location_name: str = Field(min_length=1, max_length=200)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    image_url: str | None = Field(default=None, max_length=500)
    confidence: float = Field(ge=0, le=1)
    detected_at: datetime


class IncidentRead(IncidentCreate):
    id: uuid.UUID
    status: Status
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentStatusUpdate(BaseModel):
    status: Status


class IncidentList(BaseModel):
    items: list[IncidentRead]
    total: int
    page: int
    page_size: int
