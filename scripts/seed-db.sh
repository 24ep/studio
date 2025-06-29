#!/bin/bash

# Database seeding script for CandiTrack
# This script seeds the database with initial data

set -e

echo "🚀 Starting database seeding..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "🗄️  Pushing schema to database..."
npx prisma db push --accept-data-loss

# Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Database seeding completed successfully!"
echo ""
echo "📋 Initial data created:"
echo "   - Admin user: admin@ncc.com (password: nccadmin)"
echo "   - Default positions: Software Engineer, Product Manager"
echo "   - Recruitment stages: Applied, Screening, Shortlisted, etc."
echo "   - User groups: Admin, Recruiter, Hiring Manager, etc."
echo "   - Notification channels: Email, Webhook"
echo "   - Notification events: Candidate Created, Position Filled, etc."
echo ""
echo "🔗 You can now access the application with the admin credentials." 