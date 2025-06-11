#!/bin/bash

# Script to build and start Docker Compose services in detached mode.

REINIT_DB=false

# Check for --reinit flag
if [ "$1" == "--reinit" ]; then
    REINIT_DB=true
fi

echo "Ensuring .env.local exists or providing a warning..."
if [ ! -f .env.local ]; then
    echo "WARNING: .env.local file not found. Using default environment variables from docker-compose.yml."
    echo "It's HIGHLY recommended to create a .env.local file from .env.example and customize it."
    echo "Pay special attention to NEXTAUTH_URL - it should be http://localhost:9846 if using default docker-compose port mapping."
    echo "The default admin credentials are admin@ncc.com / nccadmin (defined in pg-init-scripts/init-db.sql)."
    echo "Make sure to update the bcrypt hash in init-db.sql if you change the default admin password BEFORE first run."
fi

if [ "$REINIT_DB" = true ]; then
    echo "--- Re-initializing ---"
    echo "WARNING: The --reinit flag was provided."
    echo "This will REMOVE ALL DOCKER VOLUMES (database, MinIO files, etc.) and then restart the services."
    echo "The init-db.sql script will run, creating a fresh database schema and default admin user."
    read -p "Are you sure you want to continue? (y/N): " confirmation
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        echo "Re-initialization cancelled."
        exit 0
    fi
    echo "Stopping services and removing volumes..."
    docker-compose down -v
    if [ $? -ne 0 ]; then
        echo "Failed to stop services and remove volumes. Please check Docker Compose output."
        exit 1
    fi
    echo "Volumes removed."
fi

echo "Building and starting Candidate Matching services..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "Candidate Matching services started successfully."
    if [ "$REINIT_DB" = true ]; then
        echo "Database has been re-initialized."
    fi
    echo "Application should be available at http://localhost:9846 (or your configured NEXTAUTH_URL)."
    echo "MinIO Console (if defaults used): http://localhost:9848"
else
    echo "Failed to start Candidate Matching services. Check Docker Compose logs."
fi
