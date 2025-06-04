from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import relationship, joinedload
from .database import Base      

# Association table for post likes
post_likes = Table(
    'post_likes',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True)
)

# Association table for comment likes
comment_likes = Table(
    'comment_likes',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('comment_id', Integer, ForeignKey('comments.id'), primary_key=True)
)
        

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, index=True, nullable=False)
    hashed_pwd = Column("password_hash", String, nullable=False)
    is_admin   = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ─── Relationships ───────────────────────────────────────────────
    posts = relationship(
        "Post",
        back_populates="author",          # ← matches Post.author
        cascade="all, delete-orphan",
    )

    comments = relationship(
        "Comment",
        back_populates="author",          # if Comment.author uses "author"
        cascade="all, delete-orphan",
    )

    liked_posts = relationship(
        "Post",
        secondary=post_likes,
        back_populates="liked_by",
    )

    liked_comments = relationship(
        "Comment",
        secondary=comment_likes,
        back_populates="liked_by",
    )

    # Orders relationship
    orders = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Computed properties to satisfy API schema ---------------------
    @property
    def pickup_location(self) -> str | None:
        orders = self.__dict__.get("orders")
        if orders:
            return orders[-1].pickup_location
        return None

    @property
    def time_slot(self) -> str | None:
        orders = self.__dict__.get("orders")
        if orders:
            return orders[-1].time_slot
        return None


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_filter = Column(String, nullable=True)  # For location-specific posts
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="posts")   # must be 'posts'
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    liked_by = relationship("User", secondary=post_likes, back_populates="liked_posts")

    @property
    def likes_count(self):
        return len(self.liked_by)

    @property
    def comments_count(self):
        return len(self.comments)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # For nested comments
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")
    liked_by = relationship("User", secondary=comment_likes, back_populates="liked_comments")

    @property
    def likes_count(self):
        return len(self.liked_by)


class PickupLocation(Base):
    __tablename__ = "pickup_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    address = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    time = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    pickup_location = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, confirmed, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    menu_item = relationship("MenuItem")

    @classmethod
    def get_all_with_menu_item(cls):
        return cls.query.options(
            joinedload(Order.menu_item)
        ).all() 