from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SimulatorSettingsRead(BaseModel):
    interval_seconds: int
    is_enabled: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SimulatorSettingsUpdate(BaseModel):
    interval_seconds: int | None = Field(default=None, ge=10, le=3600)
    is_enabled: bool | None = None
