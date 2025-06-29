#!/bin/bash

set -e

echo "Starting CandiTrack application..."

# Wait for database
echo "Waiting for database at $DB_HOST:$DB_PORT..."
./wait-for-db.sh "$DB_HOST:$DB_PORT"

echo "Database is ready!"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "DATABASE_URL is set: ${DATABASE_URL:0:20}..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
if npx prisma db push --accept-data-loss; then
    echo "Schema push successful!"
else
    echo "Schema push failed, trying alternative approach..."
    # Try to create tables manually if push fails
    echo "Creating tables manually..."
    npx prisma db push --force-reset --accept-data-loss || {
        echo "ERROR: Failed to create database schema"
        exit 1
    }
fi

# Verify tables exist
echo "Verifying database tables..."
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

echo "Database setup complete!"

# Start the application
echo "Starting Next.js application..."
exec npm run start 