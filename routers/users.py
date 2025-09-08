# routers/users.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, ConfigDict,EmailStr
from typing import Optional, List

from db.database import SessionLocal
from models.user import User
from schemas.user import UserPublicOut,UserSearchResult

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Public profile ----------
@router.get("/{user_id}/public", response_model=UserPublicOut)
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user



@router.get("/search", response_model=List[UserSearchResult])
def search_users(
    q: str = Query(..., min_length=1, description="Search by display_name"),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
):
    term = f"%{q.strip()}%"
    results = (
        db.query(User)
        .filter(User.display_name.ilike(term))  # display_name only
        .order_by(User.display_name.asc())
        .limit(limit)
        .all()
    )
    return results

@router.get("/lookup")
def lookup_user(
    email: EmailStr = Query(..., description="User email to look up"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "display_name": user.display_name}
