# Progress

## Completed

- FastAPI application skeleton.
- Incident domain enums and validation schemas.
- PostgreSQL SQLAlchemy model.
- Repository/service/router structure.
- REST endpoints for create, list, get, and status update.
- WebSocket endpoint and in-process connection manager.
- Alembic configuration and initial migration.
- Backend endpoint tests with dependency override.
- Python simulator with continuous and once modes.
- Simulator tests for payload shape and API failure handling.
- Next.js dashboard with filters, table, detail panel, status updates, and live WebSocket handling.
- Dockerfiles for API, dashboard, and simulator.
- Root Docker Compose for PostgreSQL, API, dashboard, and simulator.
- README, architecture docs, API docs, progress log, and AI usage log.

## Known Limitations

- No authentication or authorization.
- No operator audit log.
- No retry queue for failed detector submissions.
- WebSocket broadcasts are in-process only.
- The dashboard has basic build-time verification but no browser automation tests yet.
