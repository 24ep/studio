# Recruitment Stages Database Issue - Fix

## Problem
The application was showing the error "User session required. Failed to load recruitment stages." This was caused by a missing database table `RecruitmentStage` that was referenced throughout the codebase but not defined in the database schema.

## Root Cause
1. The `RecruitmentStage` table was referenced in multiple API endpoints and components
2. The table was not defined in the `init-db.sql` file
3. Column name inconsistencies between the TypeScript interface (`sort_order`) and the API code (`sortOrder`)

## Solution Applied

### 1. Added RecruitmentStage Table Definition
Updated `init-db.sql` to include the missing table:

```sql
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Fixed Column Name Inconsistencies
Updated all API endpoints to use snake_case column names to match the TypeScript interface:
- Changed `sortOrder` to `sort_order`
- Changed `is_system` to `is_system` (was already correct)

### 3. Added Default System Stages
Inserted 10 default recruitment stages:
- Applied
- Screening
- Shortlisted
- Interview Scheduled
- Interviewing
- Offer Extended
- Offer Accepted
- Hired
- Rejected
- On Hold

### 4. Updated API Endpoints
Fixed the following files:
- `src/app/api/settings/recruitment-stages/route.ts`
- `src/app/api/settings/recruitment-stages/[id]/route.ts`
- `src/app/api/settings/recruitment-stages/[id]/move/route.ts`
- `src/lib/apiUtils.ts`

### 5. Database Initialization
Created `pg-init-scripts` directory and copied the updated `init-db.sql` file there to ensure proper database initialization when using Docker.

## Files Modified
1. `init-db.sql` - Added RecruitmentStage table definition
2. `src/app/api/settings/recruitment-stages/route.ts` - Fixed column names
3. `src/app/api/settings/recruitment-stages/[id]/route.ts` - Fixed column names
4. `src/app/api/settings/recruitment-stages/[id]/move/route.ts` - Updated move logic
5. `src/lib/apiUtils.ts` - Fixed column names
6. `pg-init-scripts/init-db.sql` - Copied updated schema
7. `create-recruitment-stage-table.sql` - Standalone script for manual execution

## How to Apply the Fix

### Option 1: Using Docker (Recommended)
1. Stop the current containers: `docker compose down`
2. Remove the PostgreSQL volume to force re-initialization: `docker volume rm studio_postgres_data`
3. Start the containers: `docker compose up -d`
4. The database will be automatically initialized with the new schema

### Option 2: Manual Database Update
If you have direct database access, run the SQL script:
```bash
psql -U devuser -d canditrack_db -f create-recruitment-stage-table.sql
```

### Option 3: Using the Application
1. Start the application: `npm run dev`
2. Navigate to the settings page
3. The recruitment stages should now load properly

## Verification
After applying the fix, you should be able to:
1. View recruitment stages in the settings page
2. Create, edit, and delete recruitment stages
3. Use recruitment stages in candidate management
4. No longer see the "User session required. Failed to load recruitment stages." error

## Notes
- The fix maintains backward compatibility
- All existing functionality should continue to work
- The default system stages cannot be deleted but can be modified
- Custom stages can be added, edited, and deleted as needed 