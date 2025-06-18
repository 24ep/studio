
-- PostgreSQL Initialization Script for CandiTrack ATS

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define ENUM types (if still applicable, or manage through application logic)
-- Note: For roles, using a simple TEXT column in 'User' and validating in app might be more flexible.
-- CREATE TYPE UserRole AS ENUM ('Admin', 'Recruiter', 'Hiring Manager');

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Bcrypt hash
    role VARCHAR(50) NOT NULL DEFAULT 'Recruiter', -- e.g., 'Admin', 'Recruiter', 'Hiring Manager'
    avatarUrl TEXT,
    dataAiHint VARCHAR(255),
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Position Table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level VARCHAR(100), -- e.g., 'Senior', 'Mid-Level', 'Junior', 'L3'
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "avatarUrl" TEXT, -- URL for candidate's profile image
    "dataAiHint" VARCHAR(255), -- AI hint for candidate image
    "resumePath" TEXT, -- Path to the resume file in MinIO
    "parsedData" JSONB, -- For structured resume data (personal, contact, education, experience, skills)
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0, -- Percentage (0-100)
    status VARCHAR(100) NOT NULL DEFAULT 'Applied', -- Current stage in recruitment pipeline
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- Assigned recruiter
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TransitionRecord Table (Tracks candidate status changes)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(100) NOT NULL,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transitionrecord_candidate_id ON "TransitionRecord"("candidateId");

-- ResumeHistory Table (Tracks all uploaded resumes for a candidate)
CREATE TABLE IF NOT EXISTS "ResumeHistory" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    "filePath" TEXT NOT NULL, -- Path in MinIO
    "originalFileName" VARCHAR(255) NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL -- User who uploaded this version
);
CREATE INDEX IF NOT EXISTS idx_resumehistory_candidate_id ON "ResumeHistory"("candidateId");


-- RecruitmentStage Table (Defines stages in the pipeline)
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for predefined, non-deletable stages
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LogEntry Table (For application and audit logs)
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL, -- e.g., INFO, WARN, ERROR, DEBUG, AUDIT
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Separate from log timestamp for record creation
);
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_logentry_source ON "LogEntry"(source);


-- CustomFieldDefinition Table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(50) NOT NULL, -- 'Candidate' or 'Position'
    field_key VARCHAR(100) NOT NULL, -- e.g., 'linkedin_profile', 'expected_salary'
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple'
    options JSONB, -- For select types, array of { value: string, label: string }
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key)
);

-- WebhookFieldMapping Table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_path TEXT NOT NULL UNIQUE, -- e.g., 'candidate_info.personal_info.firstname'
    source_path TEXT, -- e.g., 'payload.profile.firstName'
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- SystemSetting Table (Key-Value store for global app settings)
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- UserUIDisplayPreference Table (User-specific UI preferences for data models)
CREATE TABLE IF NOT EXISTS "UserUIDisplayPreference" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- 'Candidate' or 'Position'
    attribute_key TEXT NOT NULL, -- e.g., 'name', 'parsedData.personal_info.location'
    ui_preference VARCHAR(50) NOT NULL DEFAULT 'Standard', -- 'Standard', 'Emphasized', 'Hidden'
    custom_note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", model_type, attribute_key)
);

-- UserGroup Table
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User_UserGroup Join Table (Many-to-Many between User and UserGroup)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- UserGroup_PlatformModule Join Table (Many-to-Many between UserGroup and PlatformModuleId)
CREATE TABLE IF NOT EXISTS "UserGroup_PlatformModule" (
    group_id UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL, -- Stores PlatformModuleId as text
    PRIMARY KEY (group_id, permission_id)
);

-- NotificationEvent Table
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'CANDIDATE_CREATED', 'STATUS_UPDATED_TO_INTERVIEW'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NotificationChannel Table
CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_key VARCHAR(50) UNIQUE NOT NULL, -- 'email', 'webhook'
    label VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NotificationSetting Table
CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- For webhook URL, email templates (future), etc.
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, channel_id)
);


-- Initial Data Seeding
-- Default Admin User (Password: nccadmin)
-- Bcrypt hash for 'nccadmin' is '$2b$10$1uS8n8eHk8q18VjOACxK.eJqY.Z/VZBmH7bN7wS.l2b.S/iR9vQdK'
-- Always change this password after first login.
INSERT INTO "User" (id, name, email, password, role, "modulePermissions")
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin NCC', 'admin@ncc.com', '$2b$10$1uS8n8eHk8q18VjOACxK.eJqY.Z/VZBmH7bN7wS.l2b.S/iR9vQdK', 'Admin', ARRAY['CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT', 'USERS_MANAGE', 'USER_GROUPS_MANAGE', 'SYSTEM_SETTINGS_MANAGE', 'USER_PREFERENCES_MANAGE', 'RECRUITMENT_STAGES_MANAGE', 'CUSTOM_FIELDS_MANAGE', 'WEBHOOK_MAPPING_MANAGE', 'NOTIFICATION_SETTINGS_MANAGE', 'LOGS_VIEW']::TEXT[])
ON CONFLICT (email) DO NOTHING;

-- Default Recruitment Stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Candidate has applied for the position.', TRUE, 0),
('Screening', 'Initial screening of the candidate''s application.', TRUE, 10),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 20),
('Interview Scheduled', 'An interview has been scheduled with the candidate.', TRUE, 30),
('Interviewing', 'Candidate is currently in the interview process.', TRUE, 40),
('Offer Extended', 'A job offer has been extended to the candidate.', TRUE, 50),
('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 60),
('Hired', 'Candidate has been hired.', TRUE, 70),
('Rejected', 'Candidate has been rejected for the position.', TRUE, 80),
('On Hold', 'Candidate application is currently on hold.', TRUE, 90)
ON CONFLICT (name) DO NOTHING;

-- Default System Settings (can be updated via UI)
INSERT INTO "SystemSetting" (key, value) VALUES
('appName', 'CandiTrack ATS'),
('appLogoDataUrl', NULL), -- No default logo initially
('appThemePreference', 'system'),
('smtpHost', NULL),
('smtpPort', NULL),
('smtpUser', NULL),
('smtpSecure', 'true'),
('smtpFromEmail', NULL)
ON CONFLICT (key) DO NOTHING;


-- Default Notification Events
INSERT INTO "NotificationEvent" (event_key, label, description) VALUES
('CANDIDATE_CREATED', 'New Candidate Created', 'Triggered when a new candidate profile is created in the system.'),
('CANDIDATE_STATUS_UPDATED', 'Candidate Status Updated', 'Triggered when a candidate''s status changes in the pipeline.'),
('NEW_RESUME_UPLOADED', 'New Resume Uploaded', 'Triggered when a new resume is uploaded for a candidate.'),
('POSITION_CREATED', 'New Position Created', 'Triggered when a new job position is added.'),
('USER_ASSIGNED_TO_CANDIDATE', 'User Assigned to Candidate', 'Triggered when a recruiter is assigned to a candidate.')
ON CONFLICT (event_key) DO NOTHING;

-- Default Notification Channels
INSERT INTO "NotificationChannel" (channel_key, label) VALUES
('email', 'Email'),
('webhook', 'Webhook')
ON CONFLICT (channel_key) DO NOTHING;

-- Example: Default mapping for n8n (can be overridden by user in UI)
INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes) VALUES
('candidate_info.personal_info.firstname', 'candidate_info.personal_info.firstname', 'Default map for first name'),
('candidate_info.personal_info.lastname', 'candidate_info.personal_info.lastname', 'Default map for last name'),
('candidate_info.contact_info.email', 'candidate_info.contact_info.email', 'Default map for email'),
('candidate_info.contact_info.phone', 'candidate_info.contact_info.phone', 'Default map for phone')
ON CONFLICT (target_path) DO NOTHING;


-- Update "updatedAt" column on row update for all tables that have it
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables
DO $$
DECLARE
  tbl_name TEXT;
BEGIN
  FOR tbl_name IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updatedAt' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON %I;', tbl_name);
    EXECUTE format('
      CREATE TRIGGER set_timestamp
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    ', tbl_name);
  END LOOP;
END;
$$;


-- Print a success message to PostgreSQL logs
DO $$
BEGIN
  RAISE NOTICE 'CandiTrack ATS database schema initialized/updated successfully.';
END;
$$;
