from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

# User schemas
class UserBase(BaseModel):
    name: str
    email: str
    image_url: Optional[str] = None
    pickup_location: Optional[str] = None
    time_slot: Optional[str] = None

class User(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserOut(User):
    pass

# Post schemas  
class PostBase(BaseModel):
    content: str
    location_filter: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = None
    location_filter: Optional[str] = None

class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: User
    likes_count: int
    comments_count: int
    comments: List[Comment] = []

    model_config = ConfigDict(from_attributes=True)

class PostWithLikeStatus(Post):
    is_liked_by_user: Optional[bool] = False

# Comment schemas
class CommentBase(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class Comment(CommentBase):
    id: int
    author_id: int
    post_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: User
    likes_count: int
    replies: List['Comment'] = []

    model_config = ConfigDict(from_attributes=True)

class CommentWithLikeStatus(Comment):
    is_liked_by_user: Optional[bool] = False

# Like response
class LikeResponse(BaseModel):
    liked: bool
    likes_count: int

# Update forward references
Post.model_rebuild()
Comment.model_rebuild() 