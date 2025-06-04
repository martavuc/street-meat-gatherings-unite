"""
backend/main.py
FastAPI entry-point
"""

from __future__ import annotations

from contextlib import asynccontextmanager   # ← new
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware   # ← new

from backend.database import engine, Base
from backend.auth import router as auth_router
from backend.routes import menu
from backend.routes import social_feed

# import menu routes (after app is created)

load_dotenv()  # picks up DATABASE_URL, SECRET_KEY, etc.


# ────────────────── DB init on startup ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # ── Lightweight migration for newly-added columns ──────────────────
        from sqlalchemy import text

# ── Create 'details' column on SQLite if it isn't there already ──
        result = await conn.execute(text("PRAGMA table_info(orders)"))
        cols = [row[1] for row in result]
        if "details" not in cols:
            await conn.execute(text("ALTER TABLE orders ADD COLUMN details TEXT"))
    yield
# ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Street Meat API",
    lifespan=lifespan,   # tells FastAPI to run the block above
)

# CORS so your Vite dev-server (localhost:5173) can hit the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All the routes you've already built
app.include_router(auth_router)

# Street-Meat menu / order endpoints
app.include_router(menu.router, prefix="/api")

# Social feed endpoints
app.include_router(social_feed.router, prefix="/api/social")
