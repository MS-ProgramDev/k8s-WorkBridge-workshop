from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Schema for incoming POST /posts requests.
# Only the content is expected from the client.
class PostCreate(BaseModel):
    content: str     # The main text of the post

# Schema for returning post data to the client (GET /posts)
class PostOut(BaseModel):
    id: int  # Unique identifier for the post
    content: str  # The text content of the post
    user_email: str  # The email of the user who created the post (extracted from JWT)
    created_at: datetime  # When the post was created (auto-generated)