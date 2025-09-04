from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import models, schemas
from models.post import Post
from utils.auth_token import get_current_user
from schemas.post import PostCreate, PostOut
from db.database import Base
from models.user import User
from db.database import SessionLocal
from sqlalchemy.exc import IntegrityError
from typing import List
from utils.db_post import create_post_db, get_all_posts_db
from datetime import datetime
import logging
import models.post

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
        return obj
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
    limit: int = Query(20, le=100)
):
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts
