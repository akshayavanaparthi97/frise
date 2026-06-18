"""Database configuration and setup."""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

# Database configuration
DATABASE_URL = "sqlite:///./frise.db"

# SQLite configuration with proper settings
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    ensure_food_item_columns()


def ensure_food_item_columns():
    """Add new SQLite columns for existing local databases."""
    inspector = inspect(engine)
    if "food_items" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("food_items")
    }
    migrations = {
        "shelf_location": (
            "ALTER TABLE food_items ADD COLUMN shelf_location VARCHAR(100)"
        ),
        "storage_state": (
            "ALTER TABLE food_items ADD COLUMN storage_state VARCHAR(100)"
        ),
        "space_units": (
            "ALTER TABLE food_items ADD COLUMN space_units INTEGER DEFAULT 1"
        ),
    }

    with engine.begin() as connection:
        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))
