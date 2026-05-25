"""stub_migration

Revision ID: 02a170dc410f
Revises: 3bf8d83c79c2
Create Date: 2026-05-25 11:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02a170dc410f'
down_revision: Union[str, Sequence[str], None] = '3bf8d83c79c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - stub migration (does nothing)."""
    pass


def downgrade() -> None:
    """Downgrade schema - stub migration (does nothing)."""
    pass
