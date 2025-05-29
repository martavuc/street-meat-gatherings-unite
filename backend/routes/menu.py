from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import MenuItem as MenuItemModel, Order as OrderModel
from schemas import MenuItem, MenuItemCreate, MenuItemUpdate, Order, OrderCreate, OrderUpdate
from auth import get_current_active_user
from models import User

router = APIRouter()


@router.get("/today", response_model=List[MenuItem])
async def get_todays_menu(db: Session = Depends(get_db)):
    """Get today's available menu items"""
    return db.query(MenuItemModel).filter(MenuItemModel.is_available == True).all()


@router.post("/orders", response_model=Order)
async def create_order(
    order: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new order"""
    # Check if menu item exists and is available
    menu_item = db.query(MenuItemModel).filter(
        MenuItemModel.id == order.menu_item_id,
        MenuItemModel.is_available == True
    ).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or not available"
        )
    
    # Create order
    db_order = OrderModel(
        user_id=current_user.id,
        menu_item_id=order.menu_item_id,
        pickup_location=order.pickup_location,
        time_slot=order.time_slot
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return db_order


@router.get("/orders/me", response_model=List[Order])
async def get_my_orders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's orders"""
    return db.query(OrderModel).filter(OrderModel.user_id == current_user.id).all()


@router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific order"""
    order = db.query(OrderModel).filter(
        OrderModel.id == order_id,
        OrderModel.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order 