from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.auth.domain import UserRole
from app.auth.model import User
from app.core.database import get_session
from app.simulator_control.model import SimulatorSettings
from app.simulator_control.schemas import (
    SimulatorSettingsRead,
    SimulatorSettingsUpdate,
)


router = APIRouter()


@router.get("/api/simulator/settings", response_model=SimulatorSettingsRead)
def get_simulator_settings(db: Session = Depends(get_session)) -> SimulatorSettings:
    return ensure_simulator_settings(db)


@router.patch("/api/simulator/settings", response_model=SimulatorSettingsRead)
def update_simulator_settings(
    payload: SimulatorSettingsUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> SimulatorSettings:
    settings = ensure_simulator_settings(db)
    if payload.interval_seconds is not None:
        settings.interval_seconds = payload.interval_seconds
    if payload.is_enabled is not None:
        settings.is_enabled = payload.is_enabled
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def ensure_simulator_settings(db: Session) -> SimulatorSettings:
    settings = db.get(SimulatorSettings, 1)
    if settings is not None:
        return settings

    settings = SimulatorSettings(id=1, interval_seconds=120, is_enabled=True)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
