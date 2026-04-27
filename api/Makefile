.PHONY: dev migrate test

dev: migrate
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

migrate:
	uv run alembic upgrade head

test:
	uv run pytest
