from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import json

from database import get_db
from models import Post as PostModel, Comment as CommentModel, User as UserModel
from schemas import (
    Post, PostCreate, PostUpdate, PostWithLikeStatus,
    Comment, CommentCreate, CommentUpdate, CommentWithLikeStatus,
    LikeResponse, WebSocketMessage
)
from .websocket import websocket_manager

router = APIRouter()


def get_current_user(user_id: int, db: Session) -> UserModel:
    """Helper function to get current user"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/posts", response_model=List[PostWithLikeStatus])
async def get_posts(
    location_filter: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get posts with optional location filtering"""
    query = db.query(PostModel).options(
        joinedload(PostModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.author),
        joinedload(PostModel.liked_by)
    )
    
    if location_filter and location_filter != "all":
        query = query.filter(
            (PostModel.location_filter == location_filter) | 
            (PostModel.location_filter.is_(None))
        )
    
    posts = query.order_by(PostModel.created_at.desc()).offset(offset).limit(limit).all()
    
    # Add like status for current user
    posts_with_like_status = []
    for post in posts:
        post_data = PostWithLikeStatus.model_validate(post)
        if user_id:
            post_data.is_liked_by_user = any(user.id == user_id for user in post.liked_by)
        posts_with_like_status.append(post_data)
    
    return posts_with_like_status


@router.post("/posts", response_model=PostWithLikeStatus)
async def create_post(
    post: PostCreate, 
    user_id: int,
    db: Session = Depends(get_db)
):
    """Create a new post"""
    user = get_current_user(user_id, db)
    
    # Create new post
    db_post = PostModel(
        content=post.content,
        location_filter=post.location_filter,
        author_id=user_id
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    # Load relationships
    db_post = db.query(PostModel).options(
        joinedload(PostModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.author),
        joinedload(PostModel.liked_by)
    ).filter(PostModel.id == db_post.id).first()
    
    post_data = PostWithLikeStatus.model_validate(db_post)
    
    # Notify via WebSocket
    await websocket_manager.broadcast_message(WebSocketMessage(
        type="post_created",
        data=post_data.model_dump(),
        user_id=user_id,
        location_filter=post.location_filter
    ))
    
    return post_data


@router.get("/posts/{post_id}", response_model=PostWithLikeStatus)
async def get_post(
    post_id: int, 
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get a specific post by ID"""
    post = db.query(PostModel).options(
        joinedload(PostModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.author),
        joinedload(PostModel.liked_by)
    ).filter(PostModel.id == post_id).first()
    
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
    user_id: int,
    db: Session = Depends(get_db)
):
    """Update a post (only by author or admin)"""
    user = get_current_user(user_id, db)
    
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if post.author_id != user_id and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own posts"
        )
    
    # Update post fields
    for field, value in post_update.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    
    db.commit()
    db.refresh(post)
    
    # Reload with relationships
    post = db.query(PostModel).options(
        joinedload(PostModel.author),
        joinedload(PostModel.comments).joinedload(CommentModel.author),
        joinedload(PostModel.liked_by)
    ).filter(PostModel.id == post_id).first()
    
    post_data = PostWithLikeStatus.model_validate(post)
    post_data.is_liked_by_user = any(user.id == user_id for user in post.liked_by)
    
    return post_data


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Delete a post (only by author or admin)"""
    user = get_current_user(user_id, db)
    
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if post.author_id != user_id and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )
    
    db.delete(post)
    db.commit()
    
    # Notify via WebSocket
    await websocket_manager.broadcast_message(WebSocketMessage(
        type="post_deleted",
        data={"post_id": post_id},
        user_id=user_id,
        location_filter=post.location_filter
    ))
    
    return {"message": "Post deleted successfully"}


@router.post("/posts/{post_id}/like", response_model=LikeResponse)
async def toggle_post_like(
    post_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Toggle like on a post"""
    user = get_current_user(user_id, db)
    
    post = db.query(PostModel).options(joinedload(PostModel.liked_by)).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user already liked the post
    is_liked = any(liked_user.id == user_id for liked_user in post.liked_by)
    
    if is_liked:
        # Remove like
        post.liked_by = [liked_user for liked_user in post.liked_by if liked_user.id != user_id]
        liked = False
    else:
        # Add like
        post.liked_by.append(user)
        liked = True
    
    db.commit()
    db.refresh(post)
    
    response = LikeResponse(liked=liked, likes_count=post.likes_count)
    
    # Notify via WebSocket
    await websocket_manager.broadcast_message(WebSocketMessage(
        type="post_like_toggled",
        data={
            "post_id": post_id,
            "liked": liked,
            "likes_count": post.likes_count
        },
        user_id=user_id,
        location_filter=post.location_filter
    ))
    
    return response


@router.post("/posts/{post_id}/comments", response_model=CommentWithLikeStatus)
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Create a comment on a post"""
    user = get_current_user(user_id, db)
    
    # Verify post exists
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Verify parent comment exists if specified
    if comment.parent_id:
        parent_comment = db.query(CommentModel).filter(CommentModel.id == comment.parent_id).first()
        if not parent_comment or parent_comment.post_id != post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid parent comment"
            )
    
    # Create comment
    db_comment = CommentModel(
        content=comment.content,
        author_id=user_id,
        post_id=post_id,
        parent_id=comment.parent_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Load relationships
    db_comment = db.query(CommentModel).options(
        joinedload(CommentModel.author),
        joinedload(CommentModel.liked_by)
    ).filter(CommentModel.id == db_comment.id).first()
    
    comment_data = CommentWithLikeStatus.model_validate(db_comment)
    
    # Notify via WebSocket
    await websocket_manager.broadcast_message(WebSocketMessage(
        type="comment_created",
        data=comment_data.model_dump(),
        user_id=user_id,
        location_filter=post.location_filter
    ))
    
    return comment_data


@router.get("/comments/{comment_id}", response_model=CommentWithLikeStatus)
async def get_comment(
    comment_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get a specific comment by ID"""
    comment = db.query(CommentModel).options(
        joinedload(CommentModel.author),
        joinedload(CommentModel.liked_by),
        joinedload(CommentModel.replies).joinedload(CommentModel.author)
    ).filter(CommentModel.id == comment_id).first()
    
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
    user_id: int,
    db: Session = Depends(get_db)
):
    """Update a comment (only by author or admin)"""
    user = get_current_user(user_id, db)
    
    comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check permissions
    if comment.author_id != user_id and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments"
        )
    
    # Update comment fields
    for field, value in comment_update.model_dump(exclude_unset=True).items():
        setattr(comment, field, value)
    
    db.commit()
    db.refresh(comment)
    
    # Reload with relationships
    comment = db.query(CommentModel).options(
        joinedload(CommentModel.author),
        joinedload(CommentModel.liked_by)
    ).filter(CommentModel.id == comment_id).first()
    
    comment_data = CommentWithLikeStatus.model_validate(comment)
    comment_data.is_liked_by_user = any(user.id == user_id for user in comment.liked_by)
    
    return comment_data


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Delete a comment (only by author or admin)"""
    user = get_current_user(user_id, db)
    
    comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check permissions
    if comment.author_id != user_id and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments"
        )
    
    # Get post for WebSocket notification
    post = db.query(PostModel).filter(PostModel.id == comment.post_id).first()
    
    db.delete(comment)
    db.commit()
    
    # Notify via WebSocket
    await websocket_manager.broadcast_message(WebSocketMessage(
        type="comment_deleted",
        data={"comment_id": comment_id, "post_id": comment.post_id},
        user_id=user_id,
        location_filter=post.location_filter if post else None
    ))
    
    return {"message": "Comment deleted successfully"}


@router.post("/comments/{comment_id}/like", response_model=LikeResponse)
async def toggle_comment_like(
    comment_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Toggle like on a comment"""
    user = get_current_user(user_id, db)
    
    comment = db.query(CommentModel).options(joinedload(CommentModel.liked_by)).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user already liked the comment
    is_liked = any(liked_user.id == user_id for liked_user in comment.liked_by)
    
    if is_liked:
        # Remove like
        comment.liked_by = [liked_user for liked_user in comment.liked_by if liked_user.id != user_id]
        liked = False
    else:
        # Add like
        comment.liked_by.append(user)
        liked = True
    
    db.commit()
    db.refresh(comment)
    
    response = LikeResponse(liked=liked, likes_count=comment.likes_count)
    
    # Get post for WebSocket notification
    post = db.query(PostModel).filter(PostModel.id == comment.post_id).first()
    
    # Notify via WebSocket
    await websocket_manager.broadcast_message(WebSocketMessage(
        type="comment_like_toggled",
        data={
            "comment_id": comment_id,
            "post_id": comment.post_id,
            "liked": liked,
            "likes_count": comment.likes_count
        },
        user_id=user_id,
        location_filter=post.location_filter if post else None
    ))
    
    return response 