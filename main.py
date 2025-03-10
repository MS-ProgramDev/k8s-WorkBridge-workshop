from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import jwt
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, User as UserModel  # Alias the SQLAlchemy model

app = FastAPI()

SECRET_KEY = "supersecret"

# Rename the Pydantic model to avoid conflicts with the SQLAlchemy model.
class UserSchema(BaseModel):
    username: str
    password: str

def create_token(username):
    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def get_user(db: Session, username: str):
    return db.query(UserModel).filter(UserModel.username == username).first()

@app.post("/register")
def register(user: UserSchema):
    db = SessionLocal()
    if get_user(db, user.username):
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = UserModel(username=user.username, password=user.password)
    db.add(new_user)
    db.commit()
    return {"message": "User created"}

@app.post("/login")
def login(user: UserSchema):
    db = SessionLocal()
    db_user = get_user(db, user.username)
    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.username)
    return {"access_token": token}
