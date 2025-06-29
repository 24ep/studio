#!/bin/sh
set -e

echo "🚀 Starting CandiTrack application..."

# Validate environment variables
echo "🔍 Validating environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ Error: NEXTAUTH_SECRET environment variable is required"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ Error: NEXTAUTH_URL environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"

# Wait for database to be ready
echo "⏳ Waiting for database..."
./wait-for-db.sh "$DB_HOST:$DB_PORT" -- echo "✅ Database is ready"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database schema is in sync
echo "🔍 Checking database schema..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Schema is in sync"
else
    echo "⚠️  Schema mismatch detected, forcing reset..."
    npx prisma db push --force-reset --accept-data-loss
    echo "✅ Schema reset and synchronized"
fi

# Seed database
echo "🌱 Seeding database..."
if npx tsx prisma/seed.ts; then
    echo "✅ Database seeded successfully"
else
    echo "⚠️  Seeding failed or already seeded, continuing..."
fi

# Start the application
echo "🚀 Starting application..."
exec npm run start
