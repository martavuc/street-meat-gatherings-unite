# backend/database.py
import os
from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase

# Use SQLite for development, PostgreSQL for production
SQLITE_URL = "sqlite+aiosqlite:///./streetmeat.db"

# Get DATABASE_URL from environment (Render provides this for PostgreSQL)
database_url = os.getenv("DATABASE_URL")

if database_url and database_url.startswith("postgres://"):
    # Render provides PostgreSQL URLs in the format postgres://, but SQLAlchemy needs postgresql://
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

DATABASE_URL = database_url or SQLITE_URL

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    # Needed for SQLite only, won't affect PostgreSQL
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:          # dependency
    async with AsyncSessionLocal() as session:
        yield session
