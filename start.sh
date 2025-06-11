
#!/bin/bash

# Script to build and start Docker Compose services in detached mode.

echo "Building and starting Candidate Matching services..."

# Ensure .env.local exists or provide a warning
if [ ! -f .env.local ]; then
    echo "WARNING: .env.local file not found. Using default environment variables from docker-compose.yml and .env.local.example."
    echo "It's recommended to create a .env.local file from .env.local.example and customize it."
    echo "Pay special attention to NEXTAUTH_URL - it should be http://localhost:9846 if using default docker-compose port mapping."
fi

docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "Candidate Matching services started successfully."
    echo "Application should be available at http://localhost:9846 (or your configured NEXTAUTH_URL if different from the default Docker mapping)."
    echo "MinIO Console: http://localhost:9001"
else
    echo "Failed to start Candidate Matching services. Check Docker Compose logs."
fi

    

    