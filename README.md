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

The API container runs `alembic upgrade head` before starting. The simulator defaults to one fake incident every 120 seconds. Super admins can start/stop fake event generation and change the interval from the dashboard without restarting the simulator.

Default super admin login:

```text
Email: admin@example.com
Password: admin12345
```

Change these with `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, and `SUPER_ADMIN_NAME` in Docker Compose or your environment.

## Run Locally

You can run the API and dashboard from separate terminals while still using Docker for PostgreSQL.

If the full Docker stack is already running, stop the API, dashboard, and simulator containers so local ports are free:

```bash
docker compose stop api dashboard simulator
```

Keep PostgreSQL running:

```bash
docker compose up -d postgres
```

Backend terminal:

```bash
cd api
cp .env.example .env
make dev
```

`make dev` runs Alembic migrations and then starts FastAPI with reload at `http://localhost:8000`.

Frontend terminal:

```bash
cd dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

The dashboard runs at `http://localhost:3000`.

Optional simulator terminal:

```bash
cd simulator
API_BASE_URL=http://localhost:8000 INTERVAL_SECONDS=120 RUN_MODE=continuous uv run python -m simulator.main
```

## API Summary

- `POST /api/incidents` creates an incident from a detection event.
- `GET /api/incidents` lists incidents with filters, sorting, and pagination.
- `GET /api/incidents/{incident_id}` returns one incident.
- `PATCH /api/incidents/{incident_id}/status` updates operator workflow status.
- `WS /ws/incidents` streams newly created incidents.
- `POST /api/auth/login` authenticates users.
- `POST /api/auth/register` registers users with an invitation token.
- `POST /api/invitations` creates invite-only registrations for super admins.
- `POST /api/simulator/events` lets a super admin generate fake events on demand.
- `GET /api/simulator/settings` returns the current simulator timer.
- `PATCH /api/simulator/settings` lets a super admin update the simulator timer and enabled state.
- `POST /api/incidents/{incident_id}/notifications` lets traffic monitors notify responders.
- `POST /api/incidents/{incident_id}/reports` lets police/fire users record response reports.
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
