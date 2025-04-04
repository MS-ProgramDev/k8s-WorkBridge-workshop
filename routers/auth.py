from fastapi import APIRouter, HTTPException, Header
from schemas.user import UserRegister, UserLogin
from utils.auth import hash_password, verify_password, user_exists, save_user, fake_users_temporal_db, get_user
from utils.auth_token import decode_access_token, create_access_token

router = APIRouter()

@router.post("/register")
async def register(user: UserRegister):
    if user_exists(user.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed_password = hash_password(user.password)
    save_user(user.email , hashed_password)
    # in futrue maybe should add status code (201)
    return {"message": "User created successfully"}


@router.post("/login")
async def login(user: UserLogin):
    if not user_exists(user.email):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    hashed_password=get_user(user.email)
    if not verify_password(user.password,hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token}



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

