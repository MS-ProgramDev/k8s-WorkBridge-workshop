from sqlalchemy.orm import Session
from schemas.user import UserCreate
from models.user import User

def get_user_by_email_db(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user_db(db: Session, user_data: UserCreate):
    new_user=User(
        email=user_data.email,
        hashed_password=user_data.hashed_password
                 )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def user_exists_db(db: Session, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None
