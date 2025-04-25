from sqlalchemy.orm import Session
from models.chat import Message, Group, GroupMembership
from schemas.chat import MessageCreate, GroupCreate
from typing import List


def create_message_db(db: Session, message_data: MessageCreate, sender_id: str):
    new_message = Message(
        sender_id=sender_id,
        recipient_id=message_data.recipient_id,
        content=message_data.content,
        is_group=message_data.is_group
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


def get_messages_for_user_db(db: Session, user_id: str) -> List[Message]:
    """Get all direct messages where the user is either sender or recipient"""
    return db.query(Message).filter(
        (Message.sender_id == user_id) | 
        ((Message.recipient_id == user_id) & ~Message.is_group)
    ).order_by(Message.timestamp).all()


def create_group_db(db: Session, group_data: GroupCreate) -> Group:
    new_group = Group(name=group_data.name)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group


def add_user_to_group_db(db: Session, group_id: int, user_id: str) -> GroupMembership:
    # Check if user is already in group
    existing = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id
    ).first()
    
    if existing:
        return existing
    
    membership = GroupMembership(group_id=group_id, user_id=user_id)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def get_group_db(db: Session, group_id: int) -> Group:
    return db.query(Group).filter(Group.id == group_id).first()


def get_group_messages_db(db: Session, group_id: int) -> List[Message]:
    return db.query(Message).filter(
        Message.recipient_id == str(group_id),
        Message.is_group == True
    ).order_by(Message.timestamp).all()


def is_user_in_group_db(db: Session, group_id: int, user_id: str) -> bool:
    """Check if a user is a member of a group"""
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id
    ).first()
    return membership is not None


def get_group_members_db(db: Session, group_id: int) -> List[str]:
    """Get all member IDs for a group"""
    memberships = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id
    ).all()
    return [membership.user_id for membership in memberships]