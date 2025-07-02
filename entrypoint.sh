#!/bin/sh
set -e

echo "🔧 Fixing database schema mismatch..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Current DATABASE_URL: $(echo \"$DATABASE_URL\" | cut -c1-30)..."

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Force reset the database schema
echo "🔄 Resetting database schema..."
npx prisma db push --force-reset --accept-data-loss

# Seed the database
echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Database schema fixed and seeded successfully!"
echo "🚀 Starting application..." 

# Start the main application
echo "🌐 Starting main application..."
npm run start 