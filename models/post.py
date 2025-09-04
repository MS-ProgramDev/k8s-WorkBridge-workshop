from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user_email = Column(String, ForeignKey("users.email"), nullable=False)


    owner = relationship("User", back_populates="posts", primaryjoin="User.email==Post.user_email")

    @property
    def author_display_name(self):
        return self.owner.display_name if self.owner else None

    def __repr__(self):
        return f"<Post id={self.id} content={self.content[:20]!r}>"
