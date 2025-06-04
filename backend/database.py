# backend/database.py
import os
from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase

# Use SQLite for simplicity
SQLITE_URL = "sqlite+aiosqlite:///./streetmeat.db"
DATABASE_URL = os.getenv("DATABASE_URL", SQLITE_URL)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:          # dependency
    async with AsyncSessionLocal() as session:
        yield session
