from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SimulatorSettings(Base):
    __tablename__ = "simulator_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    interval_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=120)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
