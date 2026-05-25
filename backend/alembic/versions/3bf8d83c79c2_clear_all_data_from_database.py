"""clear_all_data_from_database

Revision ID: 3bf8d83c79c2
Revises: 3ed2792ce905
Create Date: 2026-05-25 10:07:21.317144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3bf8d83c79c2'
down_revision: Union[str, Sequence[str], None] = '3ed2792ce905'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - clear all data from database tables."""
    # Delete all data from all tables in correct order (respecting foreign keys)
    op.execute("DELETE FROM consultation_notes")
    op.execute("DELETE FROM appointments")
    op.execute("DELETE FROM time_slots")
    op.execute("DELETE FROM patients")
    op.execute("DELETE FROM notifications")
    op.execute("DELETE FROM doctors")
    op.execute("DELETE FROM audit_logs")
    op.execute("DELETE FROM users")
    op.execute("DELETE FROM departments")


def downgrade() -> None:
    """Downgrade schema - no-op (data cannot be restored)."""
    pass
