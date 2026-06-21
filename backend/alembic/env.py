import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Path setup so app imports work ────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings
from app.database import Base
import app.models  # noqa: F401 — registers all ORM models with Base.metadata

# ── Alembic Config ────────────────────────────────────────────────────────────
config = context.config

# Override sqlalchemy.url from Pydantic settings
# Normalise to a sync psycopg2 URL regardless of how DATABASE_URL is specified:
#   postgresql://...          → postgresql+psycopg2://...
#   postgresql+asyncpg://...  → postgresql+psycopg2://...
#   postgresql+psycopg2://... → unchanged (already correct)
_db_url = settings.DATABASE_URL
if "+asyncpg" in _db_url:
    sync_url = _db_url.replace("+asyncpg", "+psycopg2")
elif "+psycopg2" in _db_url:
    sync_url = _db_url  # already correct
else:
    # bare postgresql:// — insert the psycopg2 driver
    sync_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Render Postgres (and most managed cloud Postgres) requires SSL.
# Append sslmode=require for any non-local connection.
_is_local = any(h in sync_url for h in ("localhost", "127.0.0.1", "@db:", "@postgres:"))
if not _is_local and "sslmode" not in sync_url:
    _sep = "&" if "?" in sync_url else "?"
    sync_url += f"{_sep}sslmode=require"

config.set_main_option("sqlalchemy.url", sync_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ── Offline mode ──────────────────────────────────────────────────────────────
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode ────────────────────────────────────────────────────────────────
def run_migrations_online() -> None:
    # Pass sslmode explicitly via connect_args for non-local connections.
    ssl_args: dict = {"sslmode": "require"} if not _is_local else {}

    # AUTOCOMMIT is required when connecting via a connection pooler
    # (Supabase Supavisor / PgBouncer in transaction mode).
    # Without it, the pooler cannot route DDL transactions and returns
    # an ENOTFOUND / connection closed error.
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=ssl_args,
        isolation_level="AUTOCOMMIT",
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            # Each migration runs as its own implicit transaction under AUTOCOMMIT.
            transaction_per_migration=True,
        )
        context.run_migrations()



if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
