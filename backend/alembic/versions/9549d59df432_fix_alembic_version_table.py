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
down_revision: Union[str, Sequence[str], None] = '3bf8d83c79c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - fix alembic_version table."""
    # Update alembic_version to point to the latest valid revision
    op.execute("UPDATE alembic_version SET version_num = '3bf8d83c79c2' WHERE version_num = '02a170dc410f'")


def downgrade() -> None:
    """Downgrade schema - no-op."""
    pass
