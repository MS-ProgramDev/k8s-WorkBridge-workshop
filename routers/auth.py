from fastapi import APIRouter, HTTPException, Header,Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.user import UserRegister, UserLogin,UserCreate
from utils.auth import hash_password, verify_password
from utils.auth_token import decode_access_token, create_access_token
from utils.db_user import get_user_by_email_db, create_user_db, user_exists_db

import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
async def register(user: UserRegister, db: Session = Depends(get_db)):
    logger.info("Received registration request for email: %s", user.email)
    existing_user = get_user_by_email_db(db,user.email)
    if existing_user:
        logger.warning("Registration failed: email already exists: %s", user.email)
        raise HTTPException(status_code=400, detail="Email already exists")

    logger.debug("Email is unique. Proceeding to hash password.")
    hashed_password = hash_password(user.password)
    logger.debug("Password hashed for email: %s", user.email)
    user_data = UserCreate(email=user.email,hashed_password=hashed_password)
    logger.debug("User data object created for email: %s", user.email)
    create_user_db(db,user_data)
    logger.info("User successfully created in database: %s", user.email)

    # in futrue maybe should add status code (201)
    return {"message": "User created successfully"}


@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    logger.info("Login attempt for email: %s", user.email)

    db_user = get_user_by_email_db(db, user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    logger.debug("Access token created for email: %s", user.email)

    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
async def get_me(authorization: str = Header(...)):
    """
    This endpoint expects an Authorization header in the format:
    "Authorization: Bearer <JWT token>"
    The token is used to authenticate the user without using server-side sessions.
    """

    logger.info("Accessing /me endpoint")

    if not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header format: %s", authorization)
        raise HTTPException(status_code=400, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    logger.debug("Extracted token from header")

    payload = decode_access_token(token)
    logger.info("Token successfully decoded for email: %s", payload.get("sub"))

    return {"email": payload["sub"]}

