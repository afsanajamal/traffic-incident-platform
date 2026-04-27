"""add auth roles and operations workflow

Revision ID: 20260427_0002
Revises: 20260425_0001
Create Date: 2026-04-27
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260427_0002"
down_revision: str | None = "20260425_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = postgresql.ENUM(
    "SUPER_ADMIN",
    "TRAFFIC_MONITOR",
    "POLICE",
    "FIRE_FIGHTER",
    name="userrole",
    create_type=False,
)


def upgrade() -> None:
    user_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
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
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "invitations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("token", sa.String(length=120), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_invitations_email", "invitations", ["email"])
    op.create_index("ix_invitations_token", "invitations", ["token"])

    op.create_table(
        "incident_notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("incident_id", sa.UUID(), nullable=False),
        sa.Column("recipient_role", user_role, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_incident_notifications_incident_id",
        "incident_notifications",
        ["incident_id"],
    )
    op.create_index(
        "ix_incident_notifications_recipient_role",
        "incident_notifications",
        ["recipient_role"],
    )

    op.create_table(
        "incident_reports",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("incident_id", sa.UUID(), nullable=False),
        sa.Column("author_id", sa.UUID(), nullable=False),
        sa.Column("responder_role", user_role, nullable=False),
        sa.Column("action_taken", sa.String(length=200), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_incident_reports_author_id", "incident_reports", ["author_id"])
    op.create_index("ix_incident_reports_incident_id", "incident_reports", ["incident_id"])


def downgrade() -> None:
    op.drop_index("ix_incident_reports_incident_id", table_name="incident_reports")
    op.drop_index("ix_incident_reports_author_id", table_name="incident_reports")
    op.drop_table("incident_reports")
    op.drop_index(
        "ix_incident_notifications_recipient_role", table_name="incident_notifications"
    )
    op.drop_index(
        "ix_incident_notifications_incident_id", table_name="incident_notifications"
    )
    op.drop_table("incident_notifications")
    op.drop_index("ix_invitations_token", table_name="invitations")
    op.drop_index("ix_invitations_email", table_name="invitations")
    op.drop_table("invitations")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    user_role.drop(op.get_bind(), checkfirst=True)
