"""fix_alembic_version_table

Revision ID: 9549d59df432
Revises: 3bf8d83c79c2
Create Date: 2026-05-25 10:56:32.079871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9549d59df432'
down_revision: Union[str, Sequence[str], None] = '02a170dc410f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - fix alembic_version table."""
    # Set alembic_version to this revision regardless of current state
    op.execute("DELETE FROM alembic_version")
    op.execute("INSERT INTO alembic_version (version_num) VALUES ('9549d59df432')")


def downgrade() -> None:
    """Downgrade schema - no-op."""
    pass
