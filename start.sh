
#!/bin/bash

# Script to build and start Docker Compose services in detached mode.

echo "Building and starting NCC Candidate Management services..."

# Ensure .env.local exists or provide a warning
if [ ! -f .env.local ]; then
    echo "WARNING: .env.local file not found. Using default environment variables from docker-compose.yml and .env.local.example."
    echo "It's recommended to create a .env.local file from .env.local.example and customize it."
fi

docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "NCC Candidate Management services started successfully."
    echo "Application should be available at http://localhost:9002 (or your configured NEXTAUTH_URL)."
    echo "MinIO Console: http://localhost:9001"
else
    echo "Failed to start NCC Candidate Management services. Check Docker Compose logs."
fi
