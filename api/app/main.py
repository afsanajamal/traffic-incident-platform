from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import ensure_super_admin
from app.auth.router import router as auth_router
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.incidents.router import router as incidents_router
from app.operations.router import router as operations_router
from app.simulator_control.router import ensure_simulator_settings
from app.simulator_control.router import router as simulator_control_router


settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(incidents_router)
app.include_router(operations_router)
app.include_router(simulator_control_router)


@app.on_event("startup")
def seed_super_admin() -> None:
    db = SessionLocal()
    try:
        ensure_super_admin(db)
        ensure_simulator_settings(db)
    finally:
        db.close()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
