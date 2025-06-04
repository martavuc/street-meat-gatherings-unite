from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

# ────────────────────────────── Menu Item ──────────────────────────────

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: str
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    is_available: Optional[bool] = None


class MenuItem(MenuItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# ────────────────────────── Pickup Location ───────────────────────────

class PickupLocation(BaseModel):
    id: int
    name: str
    address: str
    created_at: datetime

    class Config:
        orm_mode = True


# ────────────────────────────── Time Slot ──────────────────────────────

class TimeSlot(BaseModel):
    id: int
    time: str
    created_at: datetime

    class Config:
        orm_mode = True 