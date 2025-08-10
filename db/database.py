from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Build the database URL from separate env variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")



# Database connection URL
#""" format: "postgresql://<user>:<password>@<host>:<port>/<database>" """
#DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/workbridge"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Attempting to connect to database at: {DATABASE_URL}")


# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Session for DB interactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()