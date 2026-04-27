# Traffic Incident API

FastAPI backend for ingesting traffic incident detections and exposing them to the operator dashboard.

## Local Development

```bash
cp .env.example .env
make dev
```

This runs `alembic upgrade head` and starts Uvicorn with reload on port `8000`.
