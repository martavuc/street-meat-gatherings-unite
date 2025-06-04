from .menu import MenuItem, MenuItemCreate, MenuItemUpdate, PickupLocation, TimeSlot
from .order import Order, OrderCreate, OrderUpdate
from .social import (
    Post, PostCreate, PostUpdate, PostWithLikeStatus,
    Comment, CommentCreate, CommentUpdate, CommentWithLikeStatus,
    LikeResponse, User, UserOut
)

# Auth-related schemas
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SignupIn(BaseModel):
    name: str
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

__all__ = [
    # Menu schemas
    'MenuItem', 'MenuItemCreate', 'MenuItemUpdate', 'PickupLocation', 'TimeSlot',
    # Order schemas
    'Order', 'OrderCreate', 'OrderUpdate',
    # Social schemas
    'Post', 'PostCreate', 'PostUpdate', 'PostWithLikeStatus',
    'Comment', 'CommentCreate', 'CommentUpdate', 'CommentWithLikeStatus',
    'LikeResponse', 'User', 'UserOut',
    # Auth schemas
    'SignupIn', 'LoginIn', 'TokenOut'
]
