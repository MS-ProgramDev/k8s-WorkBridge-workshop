# utils/db_post.py

from sqlalchemy.orm import Session
from models.post import Post
from schemas.post import PostCreate
from datetime import datetime

def create_post_db(db: Session, post_data: PostCreate, user_email: str):
    new_post = Post(
        content=post_data.content,
        user_email=user_email,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


def get_post_by_id_db(db: Session, post_id: int):
    return db.query(Post).filter(Post.id == post_id).first()


def get_all_posts_db(db: Session):
    return db.query(Post).all()


def delete_post_db(db: Session, post_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post:
        db.delete(post)
        db.commit()
        return True
    return False
