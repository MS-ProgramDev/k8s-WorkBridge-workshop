
from pydantic import BaseModel, EmailStr

"""in future can add Fields like name, address, phone number, etc."""
# Schema for user registration
# Input directly from the client when registering (contains plain-text password)
# Later, the password will be hashed and transformed into a UserCreate schema
class UserRegister(BaseModel):
    email: EmailStr
    password: str

# Schema for user login
# Used to receive login credentials from the client (email + plain-text password)
# Typically used in /login endpoint
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for creating a user in the database
# Used internally after hashing the password
# This schema is passed to create_user() to insert the user into the database
class UserCreate(BaseModel):
    email: EmailStr
    hashed_password: str