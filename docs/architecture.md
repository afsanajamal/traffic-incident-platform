# Architecture

## System Flow

```text
Fake detection event generator
  -> POST /api/incidents
  -> FastAPI service layer
  -> PostgreSQL incidents table
  -> WebSocket broadcast
  -> Next.js operator dashboard
```

## Components

### API

FastAPI exposes the ingestion and read APIs. The code is split into domain enums, Pydantic schemas, SQLAlchemy model, repository, service, router, and realtime connection manager.

### Database

PostgreSQL stores incidents. Alembic owns schema history. Normal application startup does not call `Base.metadata.create_all()`.

### Realtime

When an incident is created, the API broadcasts an `incident.created` payload to connected WebSocket clients. This supports the assignment scenario where speed matters for operators.

### Simulator

The simulator generates realistic payloads using fixed highway camera metadata. It replaces the real AI/video system for demonstration.

### Dashboard

The dashboard is an operational interface: dense table, filters, sorting, detail panel, live indicator, and status actions.

## Production Improvements

- Authentication and role-based permissions.
- Operator audit trail for status changes.
- Retryable ingestion queue for detector events.
- Redis or message broker for WebSocket fan-out across API replicas.
- Observability with structured logs, traces, and metrics.
- Retention policy for old incidents and snapshots.
- PostGIS for geospatial filtering and map-based workflows.
