from fastapi import APIRouter, HTTPException, Header, Depends, status
from sqlalchemy.orm import Session
from typing import List
import logging

from db.database import SessionLocal
from schemas.chat import MessageCreate, MessageOut, GroupCreate, GroupOut, GroupMembershipCreate
from utils.auth_token import decode_access_token
from utils.db_chat import (
    create_message_db, get_messages_for_user_db, create_group_db, 
    add_user_to_group_db, get_group_db, get_group_messages_db,
    is_user_in_group_db
)

logger = logging.getLogger(__name__)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: str = Header(...)):
    """Extract user email from JWT token"""
    if not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    try:
        payload = decode_access_token(token)
        return payload["sub"]  # Email from JWT
    except Exception as e:
        logger.error(f"Error decoding token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.post("/messages/", response_model=MessageOut)
async def send_message(
    message: MessageCreate, 
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """
    Send a message to another user or a group
    """
    logger.info("Received request to send message")
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    current_user = get_current_user(authorization)
    
    # If sending to a group, verify the group exists and user is a member
    if message.is_group:
        group_id = int(message.recipient_id)
        group = get_group_db(db, group_id)
        if not group:
            logger.warning(f"Group {group_id} not found")
            raise HTTPException(status_code=404, detail="Group not found")
            
        if not is_user_in_group_db(db, group_id, current_user):
            logger.warning(f"User {current_user} not in group {group_id}")
            raise HTTPException(
                status_code=403, 
                detail="You are not a member of this group"
            )
    
    # Create and save message
    created_message = create_message_db(db, message, current_user)
    logger.info(f"Message created: {created_message.id}")
    
    # Convert to response model to ensure proper serialization
    return MessageOut(
        id=created_message.id,
        sender_id=created_message.sender_id,
        recipient_id=created_message.recipient_id,
        content=created_message.content,
        timestamp=created_message.timestamp,
        is_group=created_message.is_group
    )


@router.get("/messages/", response_model=List[MessageOut])
async def get_my_messages(
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    """
    Get all direct messages for the current user
    """
    logger.info("Received request to get messages")
    current_user = get_current_user(authorization)
    
    messages = get_messages_for_user_db(db, current_user)
    logger.info(f"Retrieved {len(messages)} messages for {current_user}")
    
    return messages


@router.get("/messages/{user_id}", response_model=List[MessageOut])
async def get_messages_with_user(
    user_id: str,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    """
    Get messages between current user and specified user
    """
    logger.info(f"Received request to get messages with user {user_id}")
    current_user = get_current_user(authorization)
    
    # Query for messages between these two users
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user) & 
         (models.Message.recipient_id == user_id) & 
         ~models.Message.is_group) |
        ((models.Message.sender_id == user_id) & 
         (models.Message.recipient_id == current_user) & 
         ~models.Message.is_group)
    ).order_by(models.Message.timestamp).all()
    
    logger.info(f"Retrieved {len(messages)} messages between {current_user} and {user_id}")
    return messages


@router.post("/groups/", response_model=GroupOut)
async def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    """
    Create a new group and add current user as first member
    """
    logger.info("Received request to create group")
    current_user = get_current_user(authorization)
    
    # Create group
    created_group = create_group_db(db, group)
    
    # Add creator as first member
    add_user_to_group_db(db, created_group.id, current_user)
    
    logger.info(f"Group created: {created_group.id}")
    return created_group


@router.post("/groups/{group_id}/join")
async def join_group(
    group_id: int,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    """
    Add current user to a group
    """
    logger.info(f"Received request to join group {group_id}")
    current_user = get_current_user(authorization)
    
    # Check if group exists
    group = get_group_db(db, group_id)
    if not group:
        logger.warning(f"Group {group_id} not found")
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Add user to group
    membership = add_user_to_group_db(db, group_id, current_user)
    
    logger.info(f"User {current_user} joined group {group_id}")
    return {"message": "Successfully joined group"}


@router.get("/groups/{group_id}/messages", response_model=List[MessageOut])
async def get_group_messages(
    group_id: int,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    """
    Get all messages for a specific group
    """
    logger.info(f"Received request to get messages for group {group_id}")
    current_user = get_current_user(authorization)
    
    # Check if group exists
    group = get_group_db(db, group_id)
    if not group:
        logger.warning(f"Group {group_id} not found")
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is in group
    if not is_user_in_group_db(db, group_id, current_user):
        logger.warning(f"User {current_user} not in group {group_id}")
        raise HTTPException(
            status_code=403, 
            detail="You are not a member of this group"
        )
    
    # Get messages
    messages = get_group_messages_db(db, group_id)
    
    logger.info(f"Retrieved {len(messages)} messages for group {group_id}")
    return messages