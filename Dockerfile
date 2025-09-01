# Backend Dockerfile
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory inside the container
WORKDIR /app

# (Optional) Install system dependencies if needed for building native extensions
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application backend source code
COPY main.py            /app/
COPY create_db_table.py /app/
COPY db/                /app/db/
COPY models/            /app/models/
COPY routers/           /app/routers/
COPY schemas/           /app/schemas/
COPY utils/             /app/utils/


# Create non-root user and set permissions
RUN useradd -r -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

# Expose the default application port
EXPOSE 8000

# Default port environment variable (overridable at runtime)
ENV PORT=8000

# Start the FastAPI application with Uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
