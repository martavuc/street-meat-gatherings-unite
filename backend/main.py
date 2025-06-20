"""
backend/main.py
FastAPI entry-point
"""

from __future__ import annotations

from contextlib import asynccontextmanager   # ← new
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

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

# Add root endpoint for health checks
@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok"}

@app.head("/", include_in_schema=False)
async def root_head():
    # Render7s health checker sends HEAD requests. Return 200 so the
    # instance is marked healthy and requests are routed to it.
    return {"status": "ok"}

# Configure CORS origins ------------------------------------------------------
# By default allow localhost for dev. You can supply a comma-separated list of
# origins in the CORS_ALLOW_ORIGINS env variable for production.

cors_env   = os.getenv("CORS_ALLOW_ORIGINS")          # comma-separated list
regex_env  = os.getenv("CORS_ALLOW_ORIGIN_REGEX")     # single regex pattern

# ── fallback for local dev ───────────────────────────────────────────
default_origins = ["http://localhost:5173"]

allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()] if cors_env else default_origins

# FastAPI's CORSMiddleware ignores allow_origins if "*" is present, so keep it simple

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in allow_origins else allow_origins,
    allow_origin_regex=regex_env,
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
