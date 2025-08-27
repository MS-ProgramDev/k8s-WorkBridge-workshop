from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Required at signup
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)

    # Optional – edited in Profile page
    avatar_url = Column(Text, nullable=True)
    bio = Column(String(280), nullable=True)
    job_title = Column(String(100), nullable=True)

    posts = relationship("Post", back_populates="owner", primaryjoin="User.email==Post.user_email")
