"""restore categories unique index

Repairs state after revision 2dd2185ece68 briefly shipped with an
unintended drop of uq_categories_user_type_lower_name.

Revision ID: 3a7c1f9d4b21
Revises: 2dd2185ece68
Create Date: 2026-08-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3a7c1f9d4b21"
down_revision: Union[str, Sequence[str], None] = "2dd2185ece68"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Restore the partial unique index if missing (idempotent)."""
    conn = op.get_bind()
    exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_indexes "
            "WHERE indexname = 'uq_categories_user_type_lower_name'"
        )
    ).first()
    if not exists:
        op.create_index(
            "uq_categories_user_type_lower_name",
            "categories",
            ["user_id", "type", sa.text("LOWER(name)")],
            unique=True,
            postgresql_where=sa.text("is_active"),
        )


def downgrade() -> None:
    # Intentionally keeps the index on downgrade: this revision only repairs.
    pass
