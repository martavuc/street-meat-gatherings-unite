from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ────────────────────────────── Order ──────────────────────────────

class OrderBase(BaseModel):
    menu_item_id: int
    pickup_location: str
    time_slot: str
    details: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    pickup_location: Optional[str] = None
    time_slot: Optional[str] = None
    status: Optional[str] = None
    details: Optional[str] = None


class Order(OrderBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True