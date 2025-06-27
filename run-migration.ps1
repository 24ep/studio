# Set environment variables
$env:DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/canditrack_db"

# Run the migration
Write-Host "Running Prisma migration..."
npx prisma migrate dev --name init

# Generate Prisma client
Write-Host "Generating Prisma client..."
npx prisma generate

Write-Host "Migration completed successfully!" 