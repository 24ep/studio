#!/bin/sh
# Safely deploy Prisma migrations and seed an explicitly targeted database.
# Usage: ./scripts/run-migrations-and-seed.sh [DATABASE_URL]

set -eu

BASELINE_MIGRATION="00000000000000_baseline"
PRISMA_SCHEMA="prisma/schema.prisma"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { printf "%b\n" "${BLUE}INFO: $1${NC}"; }
print_success() { printf "%b\n" "${GREEN}OK: $1${NC}"; }
print_warning() { printf "%b\n" "${YELLOW}WARN: $1${NC}"; }
print_error() { printf "%b\n" "${RED}ERROR: $1${NC}"; }

if [ -n "${1:-}" ]; then
    export DATABASE_URL="$1"
    print_info "Using DATABASE_URL from argument"
elif [ -n "${DATABASE_URL:-}" ]; then
    print_info "Using DATABASE_URL from environment"
else
    print_error "DATABASE_URL is not set."
    echo "Usage: $0 [DATABASE_URL]"
    exit 1
fi

DISPLAY_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
print_info "Database: $DISPLAY_URL"

if [ ! -f "package.json" ] || [ ! -f "$PRISMA_SCHEMA" ]; then
    print_error "Run this script from the Studio project root."
    exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
    print_error "npx is not installed."
    exit 1
fi

if ! pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
    print_error "Failed to connect to database."
    exit 1
fi
print_success "Database connection verified"

table_exists() {
    TABLE_NAME=$1
    EXISTS=$(psql "$DATABASE_URL" -Atc "SELECT to_regclass('public.\"${TABLE_NAME}\"') IS NOT NULL;" 2>/dev/null || echo "f")
    [ "$EXISTS" = "t" ]
}

migration_is_recorded() {
    MIGRATION_NAME=$1
    if ! table_exists "_prisma_migrations"; then
        return 1
    fi
    RECORDED=$(psql "$DATABASE_URL" -Atc \
      "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration_name = '${MIGRATION_NAME}' AND finished_at IS NOT NULL AND rolled_back_at IS NULL;" \
      2>/dev/null || echo "0")
    [ "$RECORDED" -gt 0 ] 2>/dev/null
}

adopt_baseline_if_needed() {
    if ! table_exists "User"; then
        print_info "Fresh database detected; baseline migration will create the schema."
        return 0
    fi

    if migration_is_recorded "$BASELINE_MIGRATION"; then
        print_info "Baseline migration is already recorded."
        return 0
    fi

    print_warning "Existing Studio schema has no squashed baseline record; checking Prisma-managed drift before adoption."
    if ! node scripts/check-prisma-schema-drift.cjs; then
        print_error "Existing database differs from the Prisma-managed schema. Refusing to hide drift."
        exit 1
    fi

    npx prisma migrate resolve --applied "$BASELINE_MIGRATION" --schema="$PRISMA_SCHEMA"
    print_success "Existing schema adopted into Prisma migration history."
}

print_info "Validating Prisma schema..."
npx prisma validate --schema="$PRISMA_SCHEMA"

print_info "Ensuring required PostgreSQL extensions..."
npx prisma db execute --schema="$PRISMA_SCHEMA" --file=scripts/ensure-postgresql-extensions.sql

if table_exists "service_desk_knowledge_documents"; then
    print_info "Deduplicating service desk knowledge documents before migration..."
    npx prisma db execute --schema="$PRISMA_SCHEMA" --file=scripts/dedupe-service-desk-knowledge-documents.sql
fi

adopt_baseline_if_needed

print_info "Deploying committed Prisma migrations..."
npx prisma migrate deploy --schema="$PRISMA_SCHEMA"
print_success "Migrations applied successfully"

print_info "Verifying migration status and Prisma-managed schema drift..."
npx prisma migrate status --schema="$PRISMA_SCHEMA"
node scripts/check-prisma-schema-drift.cjs
print_success "Database matches the Prisma-managed schema and documented raw SQL invariants are preserved"

print_info "Generating Prisma client..."
npx prisma generate --schema="$PRISMA_SCHEMA"

print_info "Applying database comments..."
if npm run db:comments; then
    print_success "Database comments applied"
else
    print_warning "Database comments failed; continuing because comments do not change schema correctness."
fi

print_info "Seeding database..."
if npx tsx prisma/seed.ts; then
    print_success "Database seeded successfully"
else
    print_error "Seed failed"
    exit 1
fi

print_success "Migration and seed workflow completed."
