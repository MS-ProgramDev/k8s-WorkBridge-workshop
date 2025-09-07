from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from models.post import Post
from utils.auth_token import get_current_user
from schemas.post import PostCreate, PostOut
from models.user import User
from db.database import SessionLocal
from sqlalchemy.exc import IntegrityError
from typing import List
import logging
from models.post_like import PostLike
from sqlalchemy import and_
router = APIRouter()
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/posts/", response_model=PostOut, status_code=201)
def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        obj = Post(content=post.content, user_email=current_user.email)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        # Return enriched payload so FE is in sync without extra fetch
        return {
            "id": obj.id,
            "content": obj.content,
            "user_email": obj.user_email,
            "created_at": obj.created_at,
            "author_display_name": current_user.display_name,
            "likes_count": 0,
            "liked_by_me": False,
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create post due to integrity error")
    except Exception:
        logger.exception("Failed to create post")
        raise HTTPException(status_code=500, detail="Failed to create post")



@router.get("/posts/", response_model=List[PostOut])
def get_posts(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),  # needed for liked_by_me
):
    posts = (
        db.query(Post)
        .order_by(Post.created_at.desc())
        .offset(skip).limit(limit)
        .all()
    )

    enriched = []
    for p in posts:
        likes_count = db.query(PostLike).filter(PostLike.post_id == p.id).count()
        liked_by_me = db.query(PostLike).filter(
            and_(PostLike.post_id == p.id, PostLike.user_email == current_user.email)
        ).first() is not None

        enriched.append({
            "id": p.id,
            "content": p.content,
            "user_email": p.user_email,
            "created_at": p.created_at,
            "author_display_name": getattr(p, "author_display_name", None),
            "likes_count": likes_count,
            "liked_by_me": liked_by_me,
        })
    return enriched

@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="Not allowed to delete this post")
    db.delete(post)
    db.commit()
    return


@router.post("/posts/{post_id}/like", status_code=204)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    exists = db.query(PostLike).filter(
        and_(PostLike.post_id == post_id, PostLike.user_email == current_user.email)
    ).first()

    if exists:
        return  # already liked; idempotent

    db.add(PostLike(post_id=post_id, user_email=current_user.email))
    db.commit()
    return

@router.delete("/posts/{post_id}/like", status_code=204)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    like = db.query(PostLike).filter(
        and_(PostLike.post_id == post_id, PostLike.user_email == current_user.email)
    ).first()

    if not like:
        return  # idempotent

    db.delete(like)
    db.commit()
    return