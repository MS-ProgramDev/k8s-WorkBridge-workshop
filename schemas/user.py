from typing import Optional
from pydantic import BaseModel, EmailStr, AnyHttpUrl, constr, ConfigDict

# ===== Input from client: Registration =====
class UserRegister(BaseModel):
    email: EmailStr
    password: constr(min_length=6, max_length=128)
    first_name: constr(strip_whitespace=True, min_length=1, max_length=50)
    last_name: constr(strip_whitespace=True, min_length=1, max_length=50)

# ===== Input from client: Login =====
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ===== Internal: create user after hashing password =====
class UserCreate(BaseModel):
    email: EmailStr
    hashed_password: str
    first_name: str
    last_name: str

# ===== Input from client: Update profile (/auth/me PUT) =====
class UserUpdate(BaseModel):
    first_name: Optional[constr(strip_whitespace=True, min_length=1, max_length=50)] = None
    last_name:  Optional[constr(strip_whitespace=True, min_length=1, max_length=50)] = None
    avatar_url: Optional[AnyHttpUrl] = None
    bio:        Optional[constr(strip_whitespace=True, max_length=280)] = None
    job_title:  Optional[constr(strip_whitespace=True, max_length=100)] = None

# ===== Output to client: what we return =====
class UserOut(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name:  Optional[str] = None
    avatar_url: Optional[str] = None
    bio:        Optional[str] = None
    job_title:  Optional[str] = None
    display_name: Optional[str] = None  #(read-only)

    model_config = ConfigDict(from_attributes=True)

# ===== Output to client: Public profile (/users/{id}/public) =====
class UserPublicOut(BaseModel):
    id: int
    display_name: str
    job_title: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    email: EmailStr  

    model_config = ConfigDict(from_attributes=True)

    # ---------- Search users (by display_name only) ----------
class UserSearchResult(BaseModel):
    id: int
    display_name: str
    job_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)