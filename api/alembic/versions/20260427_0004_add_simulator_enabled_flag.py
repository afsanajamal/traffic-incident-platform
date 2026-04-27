"""add simulator enabled flag

Revision ID: 20260427_0004
Revises: 20260427_0003
Create Date: 2026-04-27
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260427_0004"
down_revision: str | None = "20260427_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "simulator_settings",
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.alter_column("simulator_settings", "is_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("simulator_settings", "is_enabled")
