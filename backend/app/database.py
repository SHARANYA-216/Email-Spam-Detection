"""
MailGuard AI - Database Setup
Configures SQLAlchemy with MySQL as the required database backend.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.config import settings

db_url = settings.DATABASE_URL

if not db_url or not db_url.startswith("mysql"):
    raise RuntimeError(
        "MySQL DATABASE_URL is required. SQLite fallback is disabled for this project."
    )

engine = create_engine(db_url, pool_recycle=3600, pool_pre_ping=True)

try:
    with engine.connect() as conn:
        pass
except Exception as e:
    raise RuntimeError(f"Failed to connect to MySQL server: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
