# Traffic Incident Platform

Small traffic incident monitoring system for a back-end candidate assignment. It accepts AI detection events, stores them in PostgreSQL, exposes them through a filterable API, and displays them in an operator dashboard.

## Architecture

```text
Simulator -> FastAPI API -> PostgreSQL
                    -> WebSocket -> Next.js Dashboard
```

The simulator stands in for an upstream video analysis system. The API is the source of truth for incident identity and lifecycle status.

## Requirements

- Docker and Docker Compose
- Python 3.12 if running backend/simulator locally
- Node.js 22 if running dashboard locally

## Run Everything

```bash
docker compose up --build
```

Important URLs:

- API: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- Dashboard: http://localhost:3000
- PostgreSQL: localhost:5432

The API container runs `alembic upgrade head` before starting. The simulator posts one fake incident every five seconds.

## API Summary

- `POST /api/incidents` creates an incident from a detection event.
- `GET /api/incidents` lists incidents with filters, sorting, and pagination.
- `GET /api/incidents/{incident_id}` returns one incident.
- `PATCH /api/incidents/{incident_id}/status` updates operator workflow status.
- `WS /ws/incidents` streams newly created incidents.
- `GET /health` returns service health.

## Local Tests

Backend:

```bash
cd api
uv run pytest
```

Simulator:

```bash
cd simulator
uv run pytest
```

Dashboard build:

```bash
cd dashboard
npm install
npm run build
```

## Tradeoffs

- Authentication, authorization, and audit logs are intentionally excluded for the assignment scope.
- The simulator uses fixed camera metadata and generated events instead of real video or ML processing.
- WebSocket broadcasting is in-process. Production deployments with multiple API replicas should use Redis, PostgreSQL LISTEN/NOTIFY, or a message broker.
- PostgreSQL is used as the only database. PostGIS would be a natural future improvement for spatial queries.
