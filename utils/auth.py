from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr


"""later on we will use a database to store users and their passwords, for now we are using a dictionary to store them.
This is just for testing purposes."""
fake_users_temporal_db={}
def save_user(email: EmailStr, hashed_password: str):
    fake_users_temporal_db[email] = hashed_password

def get_user(email: EmailStr) -> str:
    return fake_users_temporal_db.get(email)

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return password_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(plain_password, hashed_password)
