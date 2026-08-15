import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. Set DATABASE_URL to a PostgreSQL connection string, "
        "for example: postgresql+psycopg2://user:password@host:5432/database"
    )

if not DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg2://")):
    raise RuntimeError(
        "Invalid DATABASE_URL. PostgreSQL is required for this project and SQLite fallback is disabled."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

try:
    connection = engine.connect()
    connection.close()
    print("Database: Connected successfully to PostgreSQL server!")
except Exception as e:
    raise RuntimeError(f"Failed to connect to PostgreSQL server: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()