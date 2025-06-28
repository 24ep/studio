#!/bin/bash

# Script to seed the database with initial data
echo "Seeding database with initial data..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run the SQL seed file
echo "Running seed SQL file..."
psql "$DATABASE_URL" -f prisma/init-db.sql

if [ $? -eq 0 ]; then
    echo "Database seeded successfully!"
else
    echo "Error seeding database"
    exit 1
fi 