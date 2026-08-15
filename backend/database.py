import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MYSQL_URL = os.getenv("DATABASE_URL")

if not MYSQL_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. Set DATABASE_URL to a MySQL connection string, "
        "for example: mysql+pymysql://user:password@localhost:3306/mailguard_db"
    )

if not MYSQL_URL.startswith("mysql"):
    raise RuntimeError(
        "Invalid DATABASE_URL. MySQL is required for this project and SQLite fallback is disabled."
    )

engine = create_engine(MYSQL_URL, pool_pre_ping=True, pool_recycle=3600)

try:
    connection = engine.connect()
    connection.close()
    print("Database: Connected successfully to MySQL server!")
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
