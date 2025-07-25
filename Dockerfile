# Use an official Python 3.9 slim image as a base
FROM python:3.11-slim


# Set the working directory inside the container to /app
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application's code into the container at /app
COPY . .

# Expose port 8000 to allow communication to the uvicorn server
EXPOSE 8000

# Command to run the application when the container starts
# Binds the server to all network interfaces on port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]