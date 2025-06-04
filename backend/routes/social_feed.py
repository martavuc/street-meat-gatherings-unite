from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import json

from ..database import get_db
from ..auth import get_current_user
from ..models import Post as PostModel, Comment as CommentModel, User as UserModel, Order as OrderModel, MenuItem as MenuItemModel
from ..schemas import (
    Post, PostCreate, PostUpdate, PostWithLikeStatus,
    Comment, CommentCreate, CommentUpdate, CommentWithLikeStatus,
    LikeResponse
)

router = APIRouter()


@router.get("/posts", response_model=List[PostWithLikeStatus])
async def get_posts(
    location_filter: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Get posts with optional location filtering"""
    query = select(PostModel).options(
        joinedload(PostModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.liked_by),
        joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.liked_by),
        joinedload(PostModel.liked_by)
    )
    
    if location_filter and location_filter != "all":
        query = query.filter(
            (PostModel.location_filter == location_filter) | 
            (PostModel.location_filter.is_(None))
        )
    
    result = await db.execute(query.order_by(PostModel.created_at.desc()).offset(offset).limit(limit))
    posts = result.unique().scalars().all()
    
    # Add like status for current user
    posts_with_like_status = []
    for post in posts:
        post_data = PostWithLikeStatus.model_validate(post)
        if user_id:
            post_data.is_liked_by_user = any(user.id == user_id for user in post.liked_by)
        posts_with_like_status.append(post_data)
    
    return posts_with_like_status


@router.get("/users-by-location/{location}")
async def get_users_by_location(
    location: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all users picking up at a specific location with their orders"""
    query = (
        select(UserModel)
        .join(OrderModel)
        .join(MenuItemModel)
        .options(joinedload(UserModel.orders).joinedload(OrderModel.menu_item))
        .filter(OrderModel.pickup_location == location)
    )
    result = await db.execute(query)
    users = result.unique().scalars().all()
    return users


@router.post("/user-profile-post/{user_id}")
async def create_or_get_user_profile_post(
    user_id: int,
    location: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or get a user's profile post for a specific location"""
    # Check if user profile post already exists for this location
    result = await db.execute(
        select(PostModel).filter(
            PostModel.author_id == user_id,
            PostModel.content.like("USER_PROFILE:%"),
            PostModel.location_filter == location
        )
    )
    existing_post = result.scalar_one_or_none()
    
    if existing_post:
        # Reload with relationships
        rel = select(PostModel).options(
            joinedload(PostModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.liked_by),
            joinedload(PostModel.liked_by)
        ).filter(PostModel.id == existing_post.id)
        res_rel = await db.execute(rel)
        return res_rel.unique().scalar_one()
    
    # Get user info
    user_result = await db.execute(select(UserModel).filter(UserModel.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's order for this location
    order_result = await db.execute(
        select(OrderModel)
        .options(joinedload(OrderModel.menu_item))
        .filter(
            OrderModel.user_id == user_id,
            OrderModel.pickup_location == location
        )
        .limit(1)
    )
    order = order_result.scalar_one_or_none()
    
    order_info = f" - Ordered: {order.menu_item.name}" if order else ""
    
    # Create profile post
    profile_post = PostModel(
        content=f"USER_PROFILE: {user.name}{order_info}",
        author_id=user_id,
        location_filter=location
    )
    
    db.add(profile_post)
    await db.commit()
    await db.refresh(profile_post)
    
    # Return with relationships
    rel = select(PostModel).options(
        joinedload(PostModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.liked_by),
        joinedload(PostModel.liked_by)
    ).filter(PostModel.id == profile_post.id)
    res_rel = await db.execute(rel)
    return res_rel.unique().scalar_one()


@router.post("/posts", response_model=PostWithLikeStatus)
async def create_post(
    post: PostCreate, 
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new post"""
    # Create new post
    db_post = PostModel(
        content=post.content,
        location_filter=post.location_filter,
        author_id=current_user.id
    )
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    
    # Load relationships
    result = await db.execute(
        select(PostModel).options(
            joinedload(PostModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.liked_by),
            joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.liked_by),
            joinedload(PostModel.liked_by)
        ).filter(PostModel.id == db_post.id)
    )
    db_post = result.unique().scalar_one()
    
    post_data = PostWithLikeStatus.model_validate(db_post)
    
    return post_data


@router.get("/posts/{post_id}", response_model=PostWithLikeStatus)
async def get_post(
    post_id: int, 
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific post by ID"""
    result = await db.execute(
        select(PostModel).options(
            joinedload(PostModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.liked_by),
            joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.liked_by),
            joinedload(PostModel.liked_by)
        ).filter(PostModel.id == post_id)
    )
    post = result.unique().scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    post_data = PostWithLikeStatus.model_validate(post)
    if user_id:
        post_data.is_liked_by_user = any(user.id == user_id for user in post.liked_by)
    
    return post_data


@router.put("/posts/{post_id}", response_model=PostWithLikeStatus)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a post (only by author or admin)"""
    result = await db.execute(select(PostModel).filter(PostModel.id == post_id))
    post = result.unique().scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own posts"
        )
    
    # Update post fields
    for field, value in post_update.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    
    await db.commit()
    await db.refresh(post)
    
    # Reload with relationships
    result = await db.execute(
        select(PostModel).options(
            joinedload(PostModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.liked_by),
            joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.author),
            joinedload(PostModel.comments).joinedload(CommentModel.replies).joinedload(CommentModel.liked_by),
            joinedload(PostModel.liked_by)
        ).filter(PostModel.id == post_id)
    )
    post = result.unique().scalar_one()
    
    post_data = PostWithLikeStatus.model_validate(post)
    post_data.is_liked_by_user = any(user.id == current_user.id for user in post.liked_by)
    
    return post_data


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a post (only by author or admin)"""
    result = await db.execute(select(PostModel).filter(PostModel.id == post_id))
    post = result.unique().scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )
    
    await db.delete(post)
    await db.commit()
    
    return {"message": "Post deleted successfully"}


@router.post("/posts/{post_id}/like", response_model=LikeResponse)
async def toggle_post_like(
    post_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle like on a post"""
    result = await db.execute(
        select(PostModel).options(joinedload(PostModel.liked_by)).filter(PostModel.id == post_id)
    )
    post = result.unique().scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user already liked the post
    is_liked = any(liked_user.id == current_user.id for liked_user in post.liked_by)
    
    if is_liked:
        # Remove like
        post.liked_by = [liked_user for liked_user in post.liked_by if liked_user.id != current_user.id]
        liked = False
    else:
        # Add like
        post.liked_by.append(current_user)
        liked = True
    
    await db.commit()
    await db.refresh(post)
    
    response = LikeResponse(liked=liked, likes_count=post.likes_count)
    
    return response


@router.post("/posts/{post_id}/comments", response_model=CommentWithLikeStatus)
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a comment on a post"""
    # Verify post exists
    result = await db.execute(select(PostModel).filter(PostModel.id == post_id))
    post = result.unique().scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Verify parent comment exists if specified
    if comment.parent_id:
        parent_result = await db.execute(select(CommentModel).filter(CommentModel.id == comment.parent_id))
        parent_comment = parent_result.unique().scalar_one_or_none()
        if not parent_comment or parent_comment.post_id != post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid parent comment"
            )
    
    # Create comment
    db_comment = CommentModel(
        content=comment.content,
        author_id=current_user.id,
        post_id=post_id,
        parent_id=comment.parent_id
    )
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)
    
    # Load relationships
    result = await db.execute(
        select(CommentModel).options(
            joinedload(CommentModel.author),
            joinedload(CommentModel.liked_by),
            joinedload(CommentModel.replies).joinedload(CommentModel.author),
            joinedload(CommentModel.replies).joinedload(CommentModel.liked_by)
        ).filter(CommentModel.id == db_comment.id)
    )
    db_comment = result.unique().scalar_one()
    
    comment_data = CommentWithLikeStatus.model_validate(db_comment)
    
    return comment_data


@router.get("/comments/{comment_id}", response_model=CommentWithLikeStatus)
async def get_comment(
    comment_id: int,
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific comment by ID"""
    result = await db.execute(
        select(CommentModel).options(
            joinedload(CommentModel.author),
            joinedload(CommentModel.liked_by),
            joinedload(CommentModel.replies).joinedload(CommentModel.author),
            joinedload(CommentModel.replies).joinedload(CommentModel.liked_by)
        ).filter(CommentModel.id == comment_id)
    )
    comment = result.unique().scalar_one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    comment_data = CommentWithLikeStatus.model_validate(comment)
    if user_id:
        comment_data.is_liked_by_user = any(user.id == user_id for user in comment.liked_by)
    
    return comment_data


@router.put("/comments/{comment_id}", response_model=CommentWithLikeStatus)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a comment (only by author or admin)"""
    result = await db.execute(select(CommentModel).filter(CommentModel.id == comment_id))
    comment = result.unique().scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check permissions
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments"
        )
    
    # Update comment fields
    for field, value in comment_update.model_dump(exclude_unset=True).items():
        setattr(comment, field, value)
    
    await db.commit()
    await db.refresh(comment)
    
    # Reload with relationships
    result = await db.execute(
        select(CommentModel).options(
            joinedload(CommentModel.author),
            joinedload(CommentModel.liked_by)
        ).filter(CommentModel.id == comment_id)
    )
    comment = result.unique().scalar_one()
    
    comment_data = CommentWithLikeStatus.model_validate(comment)
    comment_data.is_liked_by_user = any(user.id == current_user.id for user in comment.liked_by)
    
    return comment_data


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a comment (only by author or admin)"""
    result = await db.execute(select(CommentModel).filter(CommentModel.id == comment_id))
    comment = result.unique().scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check permissions
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments"
        )
    
    # Get post for WebSocket notification
    result = await db.execute(select(PostModel).filter(PostModel.id == comment.post_id))
    post = result.unique().scalar_one_or_none()
    
    await db.delete(comment)
    await db.commit()
    
    return {"message": "Comment deleted successfully"}


@router.post("/comments/{comment_id}/like", response_model=LikeResponse)
async def toggle_comment_like(
    comment_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle like on a comment"""
    result = await db.execute(
        select(CommentModel).options(joinedload(CommentModel.liked_by)).filter(CommentModel.id == comment_id)
    )
    comment = result.unique().scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user already liked the comment
    is_liked = any(liked_user.id == current_user.id for liked_user in comment.liked_by)
    
    if is_liked:
        # Remove like
        comment.liked_by = [liked_user for liked_user in comment.liked_by if liked_user.id != current_user.id]
        liked = False
    else:
        # Add like
        comment.liked_by.append(current_user)
        liked = True
    
    await db.commit()
    await db.refresh(comment)
    
    response = LikeResponse(liked=liked, likes_count=comment.likes_count)
    
    return response


@router.head("/posts")
async def head_posts():
    return Response(status_code=200) 