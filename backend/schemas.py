from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    name: str
    email: EmailStr
    image_url: Optional[str] = None
    pickup_location: Optional[str] = None
    time_slot: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    image_url: Optional[str] = None
    pickup_location: Optional[str] = None
    time_slot: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_admin: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class PostBase(BaseModel):
    content: str
    location_filter: Optional[str] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    content: Optional[str] = None
    location_filter: Optional[str] = None


class CommentBase(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentCreate(CommentBase):
    post_id: int


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class Comment(CommentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    author_id: int
    post_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: User
    likes_count: int
    replies: List["Comment"] = []


class Post(PostBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: User
    likes_count: int
    comments_count: int
    comments: List[Comment] = []


class PostWithLikeStatus(Post):
    is_liked_by_user: bool = False


class CommentWithLikeStatus(Comment):
    is_liked_by_user: bool = False


class PickupLocationBase(BaseModel):
    name: str
    address: str


class PickupLocationCreate(PickupLocationBase):
    pass


class PickupLocation(PickupLocationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


class TimeSlotBase(BaseModel):
    time: str


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlot(TimeSlotBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


class LikeResponse(BaseModel):
    liked: bool
    likes_count: int


class WebSocketMessage(BaseModel):
    type: str  # "post_created", "comment_created", "like_toggled", etc.
    data: dict
    user_id: Optional[int] = None
    location_filter: Optional[str] = None


class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: str
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(MenuItemBase):
    name: Optional[str] = None
    price: Optional[str] = None


class MenuItem(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class OrderBase(BaseModel):
    menu_item_id: int
    pickup_location: str
    time_slot: str


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[str] = None


class Order(OrderBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    menu_item: MenuItem 