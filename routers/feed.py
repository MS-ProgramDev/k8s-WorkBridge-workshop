from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from models.post import Post
from utils.auth_token import get_current_user
from schemas.post import PostCreate
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

@router.post("/posts/", response_model=schemas.post.PostCreate)
def create_post(post: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # יצירת הפוסט עם המשתמש הנוכחי
        new_post = create_post_db(db, post, current_user.email, datetime.utcnow())
        return new_post
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create post due to integrity error")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create post")

@router.get("/posts/", response_model=List[schemas.post.PostOut])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).all()
    return posts

