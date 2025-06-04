"""Routes for menu items, pickup locations, time slots, and orders.

All endpoints are mounted under /api via main.py so the final paths that the
frontend hits look like:

  GET  /api/menu/today
  GET  /api/pickup-locations
  GET  /api/time-slots
  POST /api/orders
  GET  /api/orders/me
  GET  /api/orders/{order_id}
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    MenuItem as MenuItemModel,
    Order as OrderModel,
    PickupLocation as PickupLocationModel,
    TimeSlot as TimeSlotModel,
    User,
)
from ..schemas.menu import (
    MenuItem,
    MenuItemCreate,
    MenuItemUpdate,
    PickupLocation,
    TimeSlot,
)
from ..schemas.order import Order, OrderCreate, OrderUpdate
from .. import google_sheets


router = APIRouter()


# ───────────────────────────────── Menu items ────────────────────────────────


@router.get("/menu/today", response_model=List[MenuItem])
async def get_todays_menu(db: AsyncSession = Depends(get_db)):
    """Return all menu items that are marked available for today."""
    res = await db.execute(select(MenuItemModel).where(MenuItemModel.is_available))
    items = res.scalars().all()

    if not items:
        # seed defaults
        defaults = [
            MenuItemModel(name="Bacon Wrapped Hotdogs", description="Delicious bacon wrapped dogs", price="$5"),
        ]
        db.add_all(defaults)
        await db.commit()
        items = defaults

    return items


# ─────────────────────────────── Pickup / TimeSlot ───────────────────────────


@router.get("/pickup-locations", response_model=List[PickupLocation])
async def get_pickup_locations(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PickupLocationModel))
    locs = res.scalars().all()

    if not locs:
        defaults = [
            PickupLocationModel(name="Kappa Sigma", address="You know where its at"),
            PickupLocationModel(name="Sigma Nu", address="557 Mayfield Ave, Stanford"),
            PickupLocationModel(name="White Plaza", address="White Memorial Plaza, Stanford"),
        ]
        db.add_all(defaults)
        await db.commit()
        locs = defaults

    return locs


@router.get("/time-slots", response_model=List[TimeSlot])
async def get_time_slots(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(TimeSlotModel))
    slots = res.scalars().all()

    if not slots:
        # simple hourly slots seed
        defaults = [
            TimeSlotModel(time="9:30 PM - 10:30 PM"),
        ]
        db.add_all(defaults)
        await db.commit()
        slots = defaults

    return slots


# ─────────────────────────────────── Orders ──────────────────────────────────


@router.post("/orders", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new order for the authenticated user."""

    res = await db.execute(
        select(MenuItemModel).where(
            MenuItemModel.id == order.menu_item_id,
            MenuItemModel.is_available,
        )
    )
    menu_item = res.scalar_one_or_none()
    if menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not available")

    db_order = OrderModel(
        user_id=current_user.id,
        menu_item_id=order.menu_item_id,
        pickup_location=order.pickup_location,
        time_slot=order.time_slot,
        details=order.details,
    )

    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)

    # Write to Google Sheet (no-op if not configured)
    try:
        google_sheets.append_order(
            user_name=current_user.name,
            menu_item=menu_item.name,
            details=order.details,
            location=order.pickup_location,
        )
    except Exception as exc:  # don't block if Sheets fails
        import logging

        logging.getLogger(__name__).warning("Google Sheets append failed: %s", exc)

    return db_order


@router.get("/orders/me", response_model=List[Order])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(OrderModel).where(OrderModel.user_id == current_user.id)
    )
    return res.scalars().all()


@router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(OrderModel).where(
            OrderModel.id == order_id, OrderModel.user_id == current_user.id
        )
    )
    order = res.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order 