-- pg-init-scripts/init-db.sql

-- Ensure the database and user from docker-compose.yml are used.
-- This script will be run automatically when the PostgreSQL container starts
-- for the first time and the 'postgres_data' volume is empty.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(255),
    "dataAiHint" VARCHAR(100),
    "modulePermissions" JSONB DEFAULT '[]'::jsonb, -- Store as array of strings
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Position table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level VARCHAR(100),
    custom_attributes JSONB DEFAULT '{}'::jsonb NULL,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Candidate table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "resumePath" VARCHAR(512), -- Path in MinIO
    "parsedData" JSONB,         -- Parsed resume data as JSON
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL, -- Foreign key to Position
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(100) NOT NULL, -- e.g., Applied, Screening, Interviewing, Hired, Rejected
    "applicationDate" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- Foreign key to User for assigned recruiter
    custom_attributes JSONB DEFAULT '{}'::jsonb NULL,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"(status);
CREATE INDEX IF NOT EXISTS idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidate_recruiter_id ON "Candidate"("recruiterId");
CREATE INDEX IF NOT EXISTS idx_candidate_parsed_data_gin ON "Candidate" USING GIN ("parsedData"); -- For searching within JSON

-- Create TransitionRecord table (for candidate status history)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    stage VARCHAR(100) NOT NULL,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who performed the action
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transition_candidate_id ON "TransitionRecord"("candidateId");

-- Create LogEntry table
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User associated with the log, if any
    details JSONB, -- For structured logging details
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_logentry_source ON "LogEntry"(source);


-- Create RecruitmentStage table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- To differentiate system stages from custom ones
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recruitmentstage_name ON "RecruitmentStage"(name);
CREATE INDEX IF NOT EXISTS idx_recruitmentstage_sort_order ON "RecruitmentStage"(sort_order);

-- Insert default system stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Initial application received.', TRUE, 10),
('Screening', 'Resume and initial screening phase.', TRUE, 20),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 30),
('Interview Scheduled', 'Interview has been scheduled with the candidate.', TRUE, 40),
('Interviewing', 'Candidate is in the interview process.', TRUE, 50),
('Offer Extended', 'Job offer has been extended to the candidate.', TRUE, 60),
('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 70),
('Hired', 'Candidate has been hired.', TRUE, 80),
('Rejected', 'Candidate has been rejected.', TRUE, 90),
('On Hold', 'Candidate application is currently on hold.', TRUE, 100)
ON CONFLICT (name) DO NOTHING;


-- Create WebhookFieldMapping table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_path TEXT NOT NULL UNIQUE, -- e.g., "candidate_info.personal_info.firstname"
    source_path TEXT,                 -- e.g., "data.profile.firstName" from n8n JSON
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhookfieldmapping_target_path ON "WebhookFieldMapping"(target_path);


-- Create CustomFieldDefinition table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(50) NOT NULL, -- 'Candidate' or 'Position'
    field_key VARCHAR(100) NOT NULL, -- Programmatic key, e.g., "linkedin_url"
    label VARCHAR(255) NOT NULL,     -- User-friendly label, e.g., "LinkedIn Profile URL"
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple')),
    options JSONB,                   -- For 'select_single', 'select_multiple' types, stores array of {value: string, label: string}
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key) -- Ensure field_key is unique per model
);
CREATE INDEX IF NOT EXISTS idx_customfielddefinition_model_name ON "CustomFieldDefinition"(model_name);
CREATE INDEX IF NOT EXISTS idx_customfielddefinition_model_field_key ON "CustomFieldDefinition"(model_name, field_key);


-- Insert Default Admin User (replace with a strong, unique password and ensure bcrypt hash is correct)
-- The plaintext password for this hash is 'nccadmin'
-- To generate a new hash:
-- const bcrypt = require('bcrypt');
-- bcrypt.hashSync('your_new_password', 10);
INSERT INTO "User" (name, email, password, role, "modulePermissions") VALUES
('NCC Admin', 'admin@ncc.com', '$2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly', 'Admin', '["CANDIDATES_VIEW", "CANDIDATES_MANAGE", "POSITIONS_VIEW", "POSITIONS_MANAGE", "USERS_MANAGE", "SETTINGS_ACCESS", "RECRUITMENT_STAGES_MANAGE", "DATA_MODELS_MANAGE", "WEBHOOK_MAPPING_MANAGE", "LOGS_VIEW"]')
ON CONFLICT (email) DO NOTHING;


-- Function to update "updatedAt" timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables that have an "updatedAt" column
-- User table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_user') THEN
    CREATE TRIGGER set_timestamp_user
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Position table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_position') THEN
    CREATE TRIGGER set_timestamp_position
    BEFORE UPDATE ON "Position"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Candidate table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_candidate') THEN
    CREATE TRIGGER set_timestamp_candidate
    BEFORE UPDATE ON "Candidate"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- TransitionRecord table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_transitionrecord') THEN
    CREATE TRIGGER set_timestamp_transitionrecord
    BEFORE UPDATE ON "TransitionRecord"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- RecruitmentStage table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_recruitmentstage') THEN
    CREATE TRIGGER set_timestamp_recruitmentstage
    BEFORE UPDATE ON "RecruitmentStage"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- WebhookFieldMapping table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_webhookfieldmapping') THEN
    CREATE TRIGGER set_timestamp_webhookfieldmapping
    BEFORE UPDATE ON "WebhookFieldMapping"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- CustomFieldDefinition table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_customfielddefinition') THEN
    CREATE TRIGGER set_timestamp_customfielddefinition
    BEFORE UPDATE ON "CustomFieldDefinition"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- End of script
SELECT 'Database initialization script completed.' as status;
