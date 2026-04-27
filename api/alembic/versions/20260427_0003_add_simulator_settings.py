"""add simulator settings

Revision ID: 20260427_0003
Revises: 20260427_0002
Create Date: 2026-04-27
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260427_0003"
down_revision: str | None = "20260427_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "simulator_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("interval_seconds", sa.Integer(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        "INSERT INTO simulator_settings (id, interval_seconds) VALUES (1, 120)"
    )


def downgrade() -> None:
    op.drop_table("simulator_settings")
