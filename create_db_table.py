"""
create_tables.py

This script initializes the database by creating all the necessary tables
based on the ORM models defined in the project.

Note:
    - This should be run manually (not as part of the server startup).
    - It will only create tables that don't already exist.
    - Make sure your DATABASE_URL is correctly set in db/database.py
"""

from db.database import Base, engine
import models.user


# Create all tables defined by models inheriting from Base
Base.metadata.create_all(bind=engine)

print("All tables created successfully (if they didn't already exist).")
