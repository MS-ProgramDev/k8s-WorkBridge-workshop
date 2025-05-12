from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    # user_id = Column(Integer, ForeignKey('users.id'))
    user_email = Column(String, ForeignKey("users.email"), nullable=False)

    owner = relationship("User", back_populates="posts", primaryjoin="User.email==Post.user_email")

    def __repr__(self):
        return f"<Post {self.title}>"
