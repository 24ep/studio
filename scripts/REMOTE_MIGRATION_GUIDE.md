# Remote Server Migration and Seed Guide

This guide explains how to run database migrations and seed data on a remote server.

## Quick Start

### Option 1: Using the Script (Recommended)

**On Linux/Mac (Bash):**
```bash
# Set DATABASE_URL and run
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
bash scripts/run-migrations-and-seed.sh

# Or pass DATABASE_URL as argument
bash scripts/run-migrations-and-seed.sh "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

**On Windows (PowerShell):**
```powershell
# Set DATABASE_URL and run
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
.\scripts\run-migrations-and-seed.ps1

# Or pass DATABASE_URL as argument
.\scripts\run-migrations-and-seed.ps1 "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Option 2: Using npm Script

```bash
# Set DATABASE_URL first
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Run migrations and seed
npm run db:migrate:seed
```

### Option 3: Manual Commands

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Run migrations
npm run db:deploy
# or
npx prisma migrate deploy --schema=prisma/schema.prisma

# Run seed
npm run db:seed
# or
npx tsx prisma/seed.ts
```

## Running on Remote Server via SSH

### Method 1: SSH and Run Script

```bash
# SSH into remote server and run the script
ssh user@remote-server "cd /path/to/project && export DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DATABASE' && bash scripts/run-migrations-and-seed.sh"
```

### Method 2: SSH and Run npm Commands

```bash
# SSH into remote server
ssh user@remote-server

# On remote server:
cd /path/to/project
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
npm run db:migrate:seed
```

### Method 3: One-liner with npm

```bash
ssh user@remote-server "cd /path/to/project && DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DATABASE' npm run db:migrate:seed"
```

## What the Script Does

1. **Validates DATABASE_URL** - Checks that the database connection string is provided
2. **Tests Connection** - Verifies the database is accessible
3. **Generates Prisma Client** - Ensures Prisma client is up to date
4. **Checks Migration Status** - Determines if migrations are needed
5. **Applies Migrations** - Runs `prisma migrate deploy` to apply pending migrations
6. **Seeds Database** - Runs `prisma seed` to populate initial data

## Troubleshooting

### Connection Issues
- Verify the database is accessible from the remote server
- Check firewall rules allow connection to port 8521
- Ensure credentials are correct

### Migration Issues
- Check if database schema is already in sync: `npx prisma migrate status`
- If migrations fail, check the error logs for specific issues

### Seed Issues
- Seed script is idempotent - safe to run multiple times
- Check logs for specific errors during seeding

## Security Note

⚠️ **Important**: Never commit database credentials to version control. Use environment variables or secure secret management.

## Database Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

Example:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

