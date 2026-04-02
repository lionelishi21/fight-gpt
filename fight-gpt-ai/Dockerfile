# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for SSL certificates and Node.js for yt-dlp JavaScript runtime support
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies from the correct requirements file
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your Python code (api.py, etc.) into the container
COPY . .

# Command to run when the container starts
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]