from fastapi import APIRouter, HTTPException, Header,Depends

from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.user import UserRegister, UserLogin,UserCreate
from utils.auth import hash_password, verify_password, user_exists, save_user, fake_users_temporal_db, get_user
from utils.auth_token import decode_access_token, create_access_token
from utils.db_user import get_user_by_email_db, create_user_db, user_exists_db


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
async def register(user: UserRegister, db: Session = Depends(get_db)):
    if user_exists_db(db,user.email):
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = hash_password(user.password)
    user_data = UserCreate(email=user.email,hashed_password=hashed_password)
    create_user_db(db,user_data)

    # in futrue maybe should add status code (201)
    return {"message": "User created successfully"}


@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email_db(db, user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def get_me(authorization: str = Header(...)):
    """
      This endpoint expects an Authorization header in the format:
      "Authorization: Bearer <JWT token>"

      The token is used to authenticate the user without using server-side sessions.
      """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = decode_access_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Include 'sub' (subject) in the token payload – identifies the user the token belongs to
    return {"email": payload["sub"]}

