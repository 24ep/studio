#!/bin/sh
set -e

echo "🚀 Starting CandiTrack application..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
./wait-for-db.sh "$DB_HOST:$DB_PORT" -- echo "✅ Database is ready"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "📊 Pushing database schema..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Schema pushed successfully"
else
    echo "⚠️  Schema push failed, trying reset..."
    npx prisma db push --force-reset --accept-data-loss
    echo "✅ Schema reset and pushed successfully"
fi

# Seed database
echo "🌱 Seeding database..."
if npx prisma db seed; then
    echo "✅ Database seeded successfully"
else
    echo "⚠️  Seeding failed or already seeded, continuing..."
fi

# Start the application
echo "🚀 Starting application..."
exec npm run start
