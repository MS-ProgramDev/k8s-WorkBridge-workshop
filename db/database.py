from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base



# Database connection URL – change after you download postgress
""" format: "postgresql://<user>:<password>@<host>:<port>/<database>" """
#DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/workbridge"
DATABASE_URL = "postgresql://workbridgeuser:your-strong-password@postgres-service:5432/workbridgedb"

print(f"Attempting to connect to database at: {DATABASE_URL}")



# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Session for DB interactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()