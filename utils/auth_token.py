"""
utils/auth_token.py

This module handles creation and decoding of JWT access tokens.

Note:
    In the future, this module may be extended to support:
    - create_refresh_token: for generating long-term refresh tokens
    - decode_refresh_token: to verify and parse refresh tokens
    - get_user_from_token: helper to extract user identity
    - blacklist / revoke: mechanism for invalidating tokens manually
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from db.database import Base
from models.user import User
from datetime import datetime, timedelta, UTC
from utils.db_user import get_user_by_email_db
import logging
from db.database import SessionLocal

SECRET_KEY = "MTA"
ALGORITHM = "HS256"

logger = logging.getLogger(__name__)
oauth3_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=30)):
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")


def get_current_user(token: str = Depends(oauth3_scheme), db: Session = Depends(get_db)) -> User:
    logger.info("Trying to decode token: %s", token)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = get_user_by_email_db(db, email)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
