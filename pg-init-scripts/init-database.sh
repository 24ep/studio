#!/bin/bash

# =====================================================
# CandiTrack Database Initialization Script
# This script can be used to manually initialize the database
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-canditrack_db}"
DB_USER="${DB_USER:-devuser}"
DB_PASSWORD="${DB_PASSWORD:-devpassword}"
INIT_SCRIPT="init-db.sql"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}CandiTrack Database Initialization Script${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) is not installed or not in PATH"
    echo "Please install PostgreSQL client tools and try again."
    exit 1
fi

# Check if the init script exists
if [ ! -f "$INIT_SCRIPT" ]; then
    print_error "Initialization script '$INIT_SCRIPT' not found"
    echo "Please ensure the script is in the current directory."
    exit 1
fi

print_status "PostgreSQL client found"
print_status "Initialization script found: $INIT_SCRIPT"

# Test database connection
echo -e "${BLUE}Testing database connection...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Cannot connect to database"
    echo "Please check your database configuration:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    exit 1
fi

# Check if database is already initialized
echo -e "${BLUE}Checking if database is already initialized...${NC}"
INITIALIZED=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT value FROM \"SystemSetting\" WHERE key = 'databaseInitialized';" 2>/dev/null | xargs)

if [ "$INITIALIZED" = "true" ]; then
    print_warning "Database appears to be already initialized"
    read -p "Do you want to reinitialize the database? This will not delete existing data but may update schema. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Database initialization skipped"
        exit 0
    fi
fi

# Execute the initialization script
echo -e "${BLUE}Executing database initialization script...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$INIT_SCRIPT"; then
    print_status "Database initialization completed successfully"
else
    print_error "Database initialization failed"
    exit 1
fi

# Verify initialization
echo -e "${BLUE}Verifying initialization...${NC}"

# Check if admin user exists
ADMIN_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = 'admin@ncc.com';" | xargs)
if [ "$ADMIN_COUNT" -eq 1 ]; then
    print_status "Admin user verified"
else
    print_error "Admin user verification failed"
    exit 1
fi

# Check if recruitment stages exist
STAGE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"RecruitmentStage\";" | xargs)
if [ "$STAGE_COUNT" -ge 10 ]; then
    print_status "Recruitment stages verified ($STAGE_COUNT stages found)"
else
    print_error "Recruitment stages verification failed"
    exit 1
fi

# Check if system settings exist
SETTING_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"SystemSetting\";" | xargs)
if [ "$SETTING_COUNT" -ge 20 ]; then
    print_status "System settings verified ($SETTING_COUNT settings found)"
else
    print_error "System settings verification failed"
    exit 1
fi

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}CandiTrack Database Initialization Completed Successfully!${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}Database Version: 1.0.0${NC}"
echo -e "${GREEN}Admin Login: admin@ncc.com / nccadmin${NC}"
echo -e "${BLUE}=====================================================${NC}"

print_status "You can now start the CandiTrack application" 