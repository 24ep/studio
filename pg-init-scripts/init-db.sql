-- =====================================================
-- CandiTrack Database Initialization Script
-- v2.0 - Aligned with Prisma Schema for Custom Fields
-- =====================================================

\set ON_ERROR_STOP on
\set VERBOSITY verbose

-- Create a log function for better debugging
CREATE OR REPLACE FUNCTION log_init(message text) RETURNS void AS $$
BEGIN
    RAISE NOTICE 'INIT: %', message;
END;
$$ LANGUAGE plpgsql;

SELECT log_init('Starting CandiTrack database initialization...');

-- Drop old custom field tables if they exist to avoid conflicts
SELECT log_init('Dropping legacy custom field tables...');
DROP TABLE IF EXISTS custom_field_values;
DROP TABLE IF EXISTS custom_field_definitions;
SELECT log_init('Legacy tables dropped.');

-- Create custom types/enums
SELECT log_init('Creating application enums...');
DO $$ 
BEGIN
    -- ENUMS FOR THE NEW DATA MODEL MANAGEMENT
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modelname') THEN
        CREATE TYPE "ModelName" AS ENUM ('Candidate', 'Position');
        SELECT log_init('Created ModelName enum');
    ELSE
        SELECT log_init('ModelName enum already exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fieldtype') THEN
        CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT');
        SELECT log_init('Created FieldType enum');
    ELSE
        SELECT log_init('FieldType enum already exists');
    END IF;

    -- Legacy enums (retained for other parts of the app)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recruitment_stage') THEN
        CREATE TYPE recruitment_stage AS ENUM ('Applied', 'Screening', 'Interview', 'Technical Assessment', 'Reference Check', 'Offer', 'Hired', 'Rejected');
        SELECT log_init('Created recruitment_stage enum');
    ELSE
        SELECT log_init('recruitment_stage enum already exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'hiring_manager', 'interviewer');
        SELECT log_init('Created user_role enum');
    ELSE
        SELECT log_init('user_role enum already exists');
    END IF;
END $$;

-- Create tables
SELECT log_init('Creating tables...');

-- Users table (remains unchanged, assuming integer IDs for now)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'recruiter',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Positions table (Updated to match Prisma Schema)
CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT,
    description TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "customAttributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
SELECT log_init('Created/Verified positions table.');

-- Candidates table (Updated to match Prisma Schema)
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    "positionId" TEXT NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    "fitScore" INTEGER NOT NULL,
    status TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdateDate" TIMESTAMP(3) NOT NULL,
    "parsedData" JSONB,
    "resumePath" TEXT,
    "customAttributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
SELECT log_init('Created/Verified candidates table.');

-- Transition Records table (Updated to match Prisma Schema)
CREATE TABLE IF NOT EXISTS transition_records (
    id TEXT PRIMARY KEY,
    date TIMESTAMP(3) NOT NULL,
    stage TEXT NOT NULL,
    notes TEXT,
    "candidateId" TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SELECT log_init('Created/Verified transition_records table.');


-- NEW Custom Field Definition table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "model" "ModelName" NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "options" TEXT[],
    "placeholder" TEXT,
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "isSystemField" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);
SELECT log_init('Created/Verified CustomFieldDefinition table.');


-- Other existing tables (retained for compatibility)
CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_group_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES user_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    context TEXT,
    user_id TEXT,
    entity_type TEXT,
    entity_id TEXT,
    ip_address INET
);
SELECT log_init('Verified other standard tables.');

-- Create Indexes
SELECT log_init('Creating indexes...');
CREATE UNIQUE INDEX IF NOT EXISTS "CustomFieldDefinition_model_name_key" ON "CustomFieldDefinition"("model", "name");
CREATE INDEX IF NOT EXISTS idx_candidates_position_id ON candidates("positionId");
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);

-- Create a function to update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
SELECT log_init('Created update_updated_at_column function.');

-- Apply the trigger to tables that have an 'updated_at' column
-- Note: Prisma will manage createdAt/updatedAt for the new tables, but we add this for consistency with any manual updates or other tables.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions') THEN
        CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidates') THEN
        CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_groups') THEN
        CREATE TRIGGER update_user_groups_updated_at BEFORE UPDATE ON user_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CustomFieldDefinition') THEN
        CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON "CustomFieldDefinition" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
SELECT log_init('Applied updated_at triggers.');


SELECT log_init('CandiTrack database initialization script finished successfully.');
-- =====================================================
-- End of Script
-- =====================================================
