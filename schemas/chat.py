from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional


class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    is_group: bool = False


class MessageOut(BaseModel):
    id: int
    sender_id: str
    recipient_id: str
    content: str
    timestamp: datetime
    is_group: bool


class GroupCreate(BaseModel):
    name: str


class GroupOut(BaseModel):
    id: int
    name: str
    created_at: datetime


class GroupMembershipCreate(BaseModel):
    user_id: str


class GroupMembershipOut(BaseModel):
    id: int
    group_id: int
    user_id: str