#!/bin/sh

set -u

BASELINE_MIGRATION="00000000000000_baseline"
BUSINESS_CONSTRAINTS_MIGRATION="20260815073000_restore_business_constraints"
PRISMA_SCHEMA="prisma/schema.prisma"

case "${NODE_ENV:-production}" in
    production|development|test)
        export NODE_ENV=${NODE_ENV:-production}
        ;;
    *)
        echo "Non-standard NODE_ENV='${NODE_ENV}' detected; using NODE_ENV=production"
        export NODE_ENV=production
        ;;
esac
export PORT=${PORT:-8021}

start_main_application() {
    if [ "${NODE_ENV:-production}" != "production" ]; then
        echo "Forcing NODE_ENV=production for next start"
    fi

    export NODE_ENV=production
    echo "Starting main application..."
    exec npm run start
}

if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
    echo "SKIP_MIGRATIONS=true - skipping database migration deployment"
    start_main_application
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

mask_database_url() {
    echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/'
}

wait_for_database() {
    echo "Waiting for database: $(mask_database_url)"

    DB_MAX_WAIT_SECONDS=${DB_MAX_WAIT_SECONDS:-90}
    DB_WAIT_INTERVAL=${DB_WAIT_INTERVAL:-5}
    ELAPSED=0

    while [ "$ELAPSED" -lt "$DB_MAX_WAIT_SECONDS" ]; do
        if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
            echo "Database connection verified"
            return 0
        fi

        sleep "$DB_WAIT_INTERVAL"
        ELAPSED=$((ELAPSED + DB_WAIT_INTERVAL))
        echo "Waiting for database... ${ELAPSED}/${DB_MAX_WAIT_SECONDS}s"
    done

    echo "ERROR: Database not ready after ${DB_MAX_WAIT_SECONDS}s"
    exit 1
}

table_exists() {
    TABLE_NAME=$1
    EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT to_regclass('public.\"${TABLE_NAME}\"') IS NOT NULL;" 2>/dev/null | xargs || echo "f")
    [ "$EXISTS" = "t" ]
}

has_required_tables() {
    table_exists "User" && \
        table_exists "SystemSetting" && \
        table_exists "LogEntry" && \
        table_exists "broadcast_campaigns" && \
        table_exists "hr_payroll_groups" && \
        table_exists "hr_payroll_exceptions" && \
        table_exists "employee_advances"
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

migration_has_unresolved_failure() {
    MIGRATION_NAME=$1

    if ! table_exists "_prisma_migrations"; then
        return 1
    fi

    FAILED=$(psql "$DATABASE_URL" -Atc \
      "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration_name = '${MIGRATION_NAME}' AND finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NOT NULL;" \
      2>/dev/null || echo "0")
    [ "$FAILED" -gt 0 ] 2>/dev/null
}

recover_known_failed_business_constraints_migration() {
    if ! migration_has_unresolved_failure "$BUSINESS_CONSTRAINTS_MIGRATION"; then
        return 0
    fi

    echo "Detected the known failed ${BUSINESS_CONSTRAINTS_MIGRATION} migration."
    echo "The original migration rejected legacy rows while adding CHECK constraints."
    echo "Marking only this failed attempt as rolled back so the idempotent NOT VALID migration can retry..."

    if ! npx prisma migrate resolve --rolled-back "$BUSINESS_CONSTRAINTS_MIGRATION" --schema="$PRISMA_SCHEMA"; then
        echo "ERROR: Unable to resolve the known failed business constraints migration"
        return 1
    fi

    echo "Known failed business constraints migration marked rolled back; safe retry enabled"
    return 0
}

database_matches_schema() {
    echo "Checking Prisma-managed schema drift while preserving documented raw SQL indexes..."
    if node scripts/check-prisma-schema-drift.cjs; then
        return 0
    fi

    echo "ERROR: Existing database differs from the Prisma-managed schema."
    echo "Refusing to mark the baseline as applied because doing so would hide schema drift."
    return 1
}

adopt_baseline_for_existing_database() {
    if ! table_exists "User"; then
        echo "Fresh database detected; baseline migration will create the schema"
        return 0
    fi

    if migration_is_recorded "$BASELINE_MIGRATION"; then
        echo "Prisma baseline migration is already recorded"
        return 0
    fi

    echo "Existing Studio database detected without the squashed Prisma baseline record."
    echo "Verifying that the live schema already matches prisma/schema.prisma before adoption..."
    if ! database_matches_schema; then
        return 1
    fi

    echo "Recording ${BASELINE_MIGRATION} as already applied to the existing database..."
    if ! npx prisma migrate resolve --applied "$BASELINE_MIGRATION" --schema="$PRISMA_SCHEMA"; then
        echo "ERROR: Unable to record the Prisma baseline migration"
        return 1
    fi

    echo "Existing database safely adopted into Prisma migration history"
    return 0
}

apply_prisma_migrations() {
    echo "Ensuring required PostgreSQL extensions..."
    npx prisma db execute --schema="$PRISMA_SCHEMA" \
      --file=scripts/ensure-postgresql-extensions.sql || \
      echo "Warning: extension bootstrap failed; migration deployment may report the required extension explicitly."

    if table_exists "service_desk_knowledge_documents"; then
        echo "Deduplicating service desk knowledge documents by (category_id, file_name)..."
        npx prisma db execute --schema="$PRISMA_SCHEMA" \
          --file=scripts/dedupe-service-desk-knowledge-documents.sql || {
            echo "ERROR: duplicate cleanup failed before migration deployment"
            return 1
          }
    fi

    if ! adopt_baseline_for_existing_database; then
        return 1
    fi

    if ! recover_known_failed_business_constraints_migration; then
        return 1
    fi

    echo "Deploying committed Prisma migrations..."
    if ! npx prisma migrate deploy --schema="$PRISMA_SCHEMA"; then
        echo "ERROR: Prisma migration deployment failed"
        return 1
    fi

    echo "Prisma migrations deployed successfully"

    echo "Verifying deployed database schema matches prisma/schema.prisma..."
    if ! database_matches_schema; then
        echo "ERROR: Prisma migrations completed but Prisma-managed schema drift remains"
        return 1
    fi
    echo "Database schema verification passed"

    echo "Backfilling legacy position organization links..."
    npx prisma db execute --schema="$PRISMA_SCHEMA" --file=scripts/backfill-position-organization-units.sql || \
      echo "Warning: position organization backfill failed; unresolved positions will remain blocked from headcount requests."
    npx tsx scripts/report-unresolved-position-organization-links.ts || \
      echo "Warning: unresolved position organization report failed."

    return 0
}

prepare_database() {
    wait_for_database

    if ! apply_prisma_migrations; then
        exit 1
    fi

    if ! has_required_tables; then
        echo "ERROR: Required tables are missing after migration deployment"
        exit 1
    fi
}

seed_database() {
    if [ "${SKIP_SEED:-true}" != "false" ]; then
        echo "Skipping seed; set SKIP_SEED=false to seed explicitly"
        return 0
    fi

    echo "Seeding database..."
    if npx prisma db seed; then
        echo "Database seed completed"
        return 0
    fi

    echo "Seed failed, continuing without seed data"
}

prepare_database
if npx prisma db execute --schema="$PRISMA_SCHEMA" --file=scripts/ensure-system-recruitment-stages.sql; then
    echo "Required recruitment stages ensured"
else
    echo "ERROR: required recruitment stages could not be ensured"
    exit 1
fi
seed_database

start_main_application
