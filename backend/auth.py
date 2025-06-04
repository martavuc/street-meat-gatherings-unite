# backend/auth.py
import os
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import SignupIn, LoginIn, TokenOut, UserOut

from .database import get_db
from .models import User
from .models import (
    PickupLocation as PickupLocationModel,
    TimeSlot as TimeSlotModel,
)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# ------------------------------------------------------------------
# JWT / password helpers
# ------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_pw(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_pw(password: str, hashed: str) -> bool:
    return pwd_ctx.verify(password, hashed)


def create_token(data: dict, expires: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=expires)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise cred_exc
    except JWTError:
        raise cred_exc

    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if user is None:
        raise cred_exc
    return user


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@router.post("/register", response_model=TokenOut)
async def register(data: SignupIn, db: AsyncSession = Depends(get_db)):
    # ─── Normalise email (trim/ lower) ───────────────────────────
    email_normalized = data.email.strip().lower()

    # email unique?  (case-insensitive check)
    res = await db.execute(select(User).where(User.email == email_normalized))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already in use")

    # Create and persist the new user
    user = User(
        name=data.name.strip(),
        email=email_normalized,
        hashed_pwd=hash_pw(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token({"sub": user.email})
    return TokenOut(access_token=token)


@router.post("/login", response_model=TokenOut)
async def login(form: OAuth2PasswordRequestForm = Depends(),
                db: AsyncSession = Depends(get_db)):

    username_norm = form.username.strip().lower()
    res = await db.execute(select(User).where(User.email == username_norm))
    user = res.scalar_one_or_none()
    if not user or not verify_pw(form.password, user.hashed_pwd):
        raise HTTPException(status_code=400, detail="Incorrect credentials")

    token = create_token({"sub": user.email})
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current: User = Depends(get_current_user)):
    return current


# ------------------------------------------------------------------
# Supporting reference data for the onboarding wizard
# ------------------------------------------------------------------


@router.get("/pickup-locations")
async def pickup_locations(db: AsyncSession = Depends(get_db)):
    """Return the list of available pickup locations."""
    res = await db.execute(select(PickupLocationModel))
    return res.scalars().all()


@router.get("/time-slots")
async def time_slots(db: AsyncSession = Depends(get_db)):
    """Return the list of allowed pickup time slots."""
    res = await db.execute(select(TimeSlotModel))
    return res.scalars().all()


@router.get("/users", response_model=List[UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User))
    return res.scalars().all()
