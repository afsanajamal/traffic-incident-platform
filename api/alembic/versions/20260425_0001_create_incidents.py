"""create incidents table

Revision ID: 20260425_0001
Revises:
Create Date: 2026-04-25
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260425_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


incident_type = postgresql.ENUM(
    "STOPPED_VEHICLE",
    "DEBRIS",
    "CONGESTION",
    "WRONG_WAY_DRIVER",
    "PEDESTRIAN",
    "ACCIDENT",
    "OTHER",
    name="incidenttype",
    create_type=False,
)
severity = postgresql.ENUM(
    "LOW", "MEDIUM", "HIGH", "CRITICAL", name="severity", create_type=False
)
status = postgresql.ENUM(
    "NEW", "ACKNOWLEDGED", "RESOLVED", "DISMISSED", name="status", create_type=False
)


def upgrade() -> None:
    incident_type.create(op.get_bind(), checkfirst=True)
    severity.create(op.get_bind(), checkfirst=True)
    status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "incidents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("type", incident_type, nullable=False),
        sa.Column("severity", severity, nullable=False),
        sa.Column("status", status, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("camera_id", sa.String(length=80), nullable=False),
        sa.Column("camera_name", sa.String(length=160), nullable=False),
        sa.Column("location_name", sa.String(length=200), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("confidence", sa.Numeric(precision=4, scale=3), nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_incidents_camera_id", "incidents", ["camera_id"])
    op.create_index("ix_incidents_created_at", "incidents", ["created_at"])
    op.create_index("ix_incidents_detected_at", "incidents", ["detected_at"])
    op.create_index("ix_incidents_severity", "incidents", ["severity"])
    op.create_index("ix_incidents_status", "incidents", ["status"])


def downgrade() -> None:
    op.drop_index("ix_incidents_status", table_name="incidents")
    op.drop_index("ix_incidents_severity", table_name="incidents")
    op.drop_index("ix_incidents_detected_at", table_name="incidents")
    op.drop_index("ix_incidents_created_at", table_name="incidents")
    op.drop_index("ix_incidents_camera_id", table_name="incidents")
    op.drop_table("incidents")
    status.drop(op.get_bind(), checkfirst=True)
    severity.drop(op.get_bind(), checkfirst=True)
    incident_type.drop(op.get_bind(), checkfirst=True)
