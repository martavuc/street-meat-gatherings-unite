from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import models  
from database import engine, Base
from routes import auth, social_feed, websocket, menu

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Street Meat Event API",
    description="Backend for Street Meat Event Community Platform",
    version="1.0.0",
    lifespan=lifespan
)
app.include_router(auth.router, prefix="/api/auth")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],  # Added port 8080
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(social_feed.router, prefix="/api/social", tags=["social"])
app.include_router(websocket.router, tags=["websocket"])
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])


@app.get("/")
async def root():
    return {"message": "Street Meat Event API"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 