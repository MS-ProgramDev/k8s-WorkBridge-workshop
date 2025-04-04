
from pydantic import BaseModel, EmailStr

"""in future can add Fields like name, address, phone number, etc."""
class UserRegister(BaseModel):
    email: EmailStr
    password: str

""""only for login"""
class UserLogin(BaseModel):
    email: EmailStr
    password: str
