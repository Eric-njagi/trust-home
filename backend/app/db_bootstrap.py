from sqlalchemy import text

from app.database import engine


def ensure_schema() -> None:
    """
    Lightweight schema bootstrap for environments without Alembic.

    This is intentionally additive-only:
    - Adds missing columns
    - Adds a partial unique index for id_number (allows multiple NULLs)
    """

    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(128) NOT NULL DEFAULT \'\''))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) NULL"))
        conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(64) NULL'))
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_id_number_unique "
                "ON users (id_number) WHERE id_number IS NOT NULL"
            )
        )

        # Invoice breakdown fields (additive-only)
        conn.execute(
            text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0")
        )
        conn.execute(
            text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2) NOT NULL DEFAULT 0")
        )
        conn.execute(
            text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(10,2) NOT NULL DEFAULT 0")
        )
        conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deductions JSONB NOT NULL DEFAULT '{}'::jsonb"))
        conn.execute(
            text("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS recipient_user_id UUID NULL")
        )

