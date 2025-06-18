
-- Enhanced init-db.sql for Candidate Matching ATS

-- Extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System Setting Table
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    key TEXT PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Upsert initial system settings (idempotent)
INSERT INTO "SystemSetting" (key, value) VALUES
    ('appName', 'CandiTrack'),
    ('appLogoDataUrl', NULL), -- Placeholder for Base64 encoded logo or URL
    ('appThemePreference', 'system'),
    ('smtpHost', NULL),
    ('smtpPort', NULL),
    ('smtpUser', NULL),
    ('smtpSecure', 'true'),
    ('smtpFromEmail', NULL),
    ('n8nResumeWebhookUrl', NULL),
    ('n8nGenericPdfWebhookUrl', NULL),
    ('geminiApiKey', NULL),
    ('loginPageBackgroundType', 'default'),
    ('loginPageBackgroundImageUrl', NULL),
    ('loginPageBackgroundColor1', '#F0F4F7'), -- Default light grey
    ('loginPageBackgroundColor2', '#3F51B5')  -- Default deep blue (for gradient example)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value WHERE "SystemSetting".value IS NULL OR "SystemSetting".key = 'appThemePreference'; -- Only update if null, except for theme


-- Platform Modules for Permissions
CREATE TABLE IF NOT EXISTS "PlatformModule" (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT
);

-- Seed Platform Modules (idempotent)
INSERT INTO "PlatformModule" (id, label, category, description) VALUES
    ('CANDIDATES_VIEW', 'View Candidates', 'Candidate Management', 'Allows viewing candidate profiles and lists.'),
    ('CANDIDATES_MANAGE', 'Manage Candidates', 'Candidate Management', 'Allows adding, editing, and deleting candidate profiles.'),
    ('CANDIDATES_IMPORT', 'Import Candidates', 'Candidate Management', 'Allows bulk importing of candidate data.'),
    ('CANDIDATES_EXPORT', 'Export Candidates', 'Candidate Management', 'Allows bulk exporting of candidate data.'),
    ('POSITIONS_VIEW', 'View Positions', 'Position Management', 'Allows viewing job position details and lists.'),
    ('POSITIONS_MANAGE', 'Manage Positions', 'Position Management', 'Allows adding, editing, and deleting job positions.'),
    ('POSITIONS_IMPORT', 'Import Positions', 'Position Management', 'Allows bulk importing of position data.'),
    ('POSITIONS_EXPORT', 'Export Positions', 'Position Management', 'Allows bulk exporting of position data.'),
    ('USERS_MANAGE', 'Manage Users', 'User Access Control', 'Allows managing user accounts and their direct permissions (typically Admin only).'),
    ('USER_GROUPS_MANAGE', 'Manage Roles (Groups)', 'User Access Control', 'Allows managing user groups (roles) and their assigned permissions.'),
    ('SYSTEM_SETTINGS_MANAGE', 'Manage System Preferences', 'System Configuration', 'Allows managing global system settings like App Name, Logo, SMTP.'),
    ('USER_PREFERENCES_MANAGE', 'Manage Own UI Preferences', 'System Configuration', 'Allows users to manage their own UI display preferences for data models.'),
    ('RECRUITMENT_STAGES_MANAGE', 'Manage Recruitment Stages', 'System Configuration', 'Allows managing the stages in the recruitment pipeline.'),
    ('CUSTOM_FIELDS_MANAGE', 'Manage Custom Fields', 'System Configuration', 'Allows defining custom data fields for candidates and positions.'),
    ('WEBHOOK_MAPPING_MANAGE', 'Manage Webhook Mappings', 'System Configuration', 'Allows configuring mappings for incoming webhook payloads.'),
    ('NOTIFICATION_SETTINGS_MANAGE', 'Manage Notification Settings', 'System Configuration', 'Allows configuring system notification events and channels.'),
    ('LOGS_VIEW', 'View Application Logs', 'Logging & Audit', 'Allows viewing system and audit logs.')
ON CONFLICT (id) DO NOTHING;


-- User Roles Enum Type (PostgreSQL specific, adjust if using other DBs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('Admin', 'Recruiter', 'Hiring Manager');
    END IF;
END
$$;

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT, -- Can be null for SSO-only users
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    role user_role_enum NOT NULL,
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of PlatformModuleId
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Group Table (Now considered "Roles")
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_system_role BOOLEAN DEFAULT FALSE, -- True for Admin, Recruiter, Hiring Manager
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction Table: User and UserGroup (Many-to-Many)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- Junction Table: UserGroup and PlatformModule (Permissions for Groups/Roles)
CREATE TABLE IF NOT EXISTS "UserGroup_PlatformModule" (
    group_id UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES "PlatformModule"(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, permission_id)
);


-- Seed Default Admin User (Idempotent, based on email)
-- Ensure password hash is generated with bcrypt for 'nccadmin' or your desired default.
-- Example bcrypt hash for 'nccadmin' (cost factor 10): $2a$10$yourActualHashForNccAdminHere
-- REPLACE THE EXAMPLE HASH BELOW WITH A REAL ONE YOU GENERATE
INSERT INTO "User" (name, email, password, role, "modulePermissions")
VALUES ('Default Admin', 'admin@ncc.com', '$2a$10$p77f7T8gCE3EMxRj3h9gP.Z17sZpY48XG81j55r2oM80oRXa1t8jO', 'Admin', ARRAY['CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT', 'USERS_MANAGE', 'USER_GROUPS_MANAGE', 'SYSTEM_SETTINGS_MANAGE', 'USER_PREFERENCES_MANAGE', 'RECRUITMENT_STAGES_MANAGE', 'CUSTOM_FIELDS_MANAGE', 'WEBHOOK_MAPPING_MANAGE', 'NOTIFICATION_SETTINGS_MANAGE', 'LOGS_VIEW'])
ON CONFLICT (email) DO NOTHING;

-- Seed Default User Groups/Roles (Idempotent)
INSERT INTO "UserGroup" (name, description, is_system_role) VALUES
    ('Admin', 'System Administrators with full access.', TRUE),
    ('Recruiter', 'Recruiters managing candidates and positions.', TRUE),
    ('Hiring Manager', 'Managers involved in candidate review and hiring decisions.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to system roles (example)
-- Admin (gets all permissions implicitly or explicitly listed)
-- Recruiter
DO $$
DECLARE
    recruiter_group_id UUID;
BEGIN
    SELECT id INTO recruiter_group_id FROM "UserGroup" WHERE name = 'Recruiter';
    IF recruiter_group_id IS NOT NULL THEN
        INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
            (recruiter_group_id, 'CANDIDATES_VIEW'),
            (recruiter_group_id, 'CANDIDATES_MANAGE'),
            (recruiter_group_id, 'POSITIONS_VIEW')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
-- Hiring Manager
DO $$
DECLARE
    hiring_manager_group_id UUID;
BEGIN
    SELECT id INTO hiring_manager_group_id FROM "UserGroup" WHERE name = 'Hiring Manager';
    IF hiring_manager_group_id IS NOT NULL THEN
        INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
            (hiring_manager_group_id, 'CANDIDATES_VIEW') -- Can only view candidates
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Assign Default Admin to Admin Group/Role
DO $$
DECLARE
    admin_user_id UUID;
    admin_group_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM "User" WHERE email = 'admin@ncc.com';
    SELECT id INTO admin_group_id FROM "UserGroup" WHERE name = 'Admin';
    IF admin_user_id IS NOT NULL AND admin_group_id IS NOT NULL THEN
        INSERT INTO "User_UserGroup" ("userId", "groupId")
        VALUES (admin_user_id, admin_group_id)
        ON CONFLICT ("userId", "groupId") DO NOTHING;
    END IF;
END $$;

-- Position Table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level TEXT,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment Stages Table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for predefined system stages
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default recruitment stages (idempotent)
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
    ('Applied', 'Initial application received.', TRUE, 0),
    ('Screening', 'Resume and initial screening.', TRUE, 10),
    ('Shortlisted', 'Candidate shortlisted for further consideration.', TRUE, 20),
    ('Interview Scheduled', 'Interview has been scheduled.', TRUE, 30),
    ('Interviewing', 'Candidate is in the interview process.', TRUE, 40),
    ('Offer Extended', 'Job offer has been extended.', TRUE, 50),
    ('Offer Accepted', 'Job offer accepted by the candidate.', TRUE, 60),
    ('Hired', 'Candidate has been hired.', TRUE, 70),
    ('Rejected', 'Candidate rejected for the position.', TRUE, 80),
    ('On Hold', 'Candidate application is temporarily on hold.', TRUE, 90)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    sort_order = EXCLUDED.sort_order;

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "resumePath" TEXT, -- Path to resume file in MinIO
    "parsedData" JSONB, -- Store parsed resume data as JSON
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status TEXT REFERENCES "RecruitmentStage"(name) ON DELETE RESTRICT DEFAULT 'Applied',
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"(status);
CREATE INDEX IF NOT EXISTS idx_candidate_positionId ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidate_recruiterId ON "Candidate"("recruiterId");


-- Resume History Table
CREATE TABLE IF NOT EXISTS "ResumeHistory" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    "filePath" TEXT NOT NULL, -- Path in MinIO
    "originalFileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_resumehistory_candidateid ON "ResumeHistory"("candidateId");


-- Transition Record Table (Candidate Status Changes)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage TEXT NOT NULL REFERENCES "RecruitmentStage"(name) ON DELETE RESTRICT,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transition_candidateid ON "TransitionRecord"("candidateId");

-- Log Entry Table
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL, -- e.g., INFO, WARN, ERROR, AUDIT
    message TEXT NOT NULL,
    source TEXT, -- e.g., API:Candidates, UI:Dashboard
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB, -- Additional structured details
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For table auditing
);
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_logentry_actinguserid ON "LogEntry"("actingUserId");


-- Custom Field Definitions Table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL, -- 'Candidate' or 'Position'
    field_key TEXT NOT NULL, -- e.g., 'linkedin_url', 'expected_salary'
    label TEXT NOT NULL,
    field_type TEXT NOT NULL, -- e.g., 'text', 'number', 'date', 'select_single', 'select_multiple'
    options JSONB, -- For select types, array of {value: string, label: string}
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key)
);

-- User UI Display Preferences Table
CREATE TABLE IF NOT EXISTS "UserUIDisplayPreference" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    model_type TEXT NOT NULL, -- 'Candidate' or 'Position'
    attribute_key TEXT NOT NULL, -- e.g., 'name', 'parsedData.personal_info.location'
    ui_preference TEXT NOT NULL, -- 'Standard', 'Emphasized', 'Hidden'
    custom_note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", model_type, attribute_key)
);
CREATE INDEX IF NOT EXISTS idx_useruidisplaypreference_userid_modeltype ON "UserUIDisplayPreference"("userId", model_type);


-- Webhook Field Mapping Table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_path TEXT NOT NULL UNIQUE, -- Path in CandiTrack's CandidateDetails model, e.g., 'personal_info.firstname'
    source_path TEXT, -- Path in the incoming JSON from n8n, e.g., 'data.profile.firstName'
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default webhook mappings (idempotent)
INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes) VALUES
    ('candidate_info.cv_language', 'candidate_info.cv_language', 'CV Language'),
    ('candidate_info.personal_info.title_honorific', 'candidate_info.personal_info.title_honorific', 'Personal - Title'),
    ('candidate_info.personal_info.firstname', 'candidate_info.personal_info.firstname', 'Personal - First Name'),
    ('candidate_info.personal_info.lastname', 'candidate_info.personal_info.lastname', 'Personal - Last Name'),
    ('candidate_info.personal_info.nickname', 'candidate_info.personal_info.nickname', 'Personal - Nickname'),
    ('candidate_info.personal_info.location', 'candidate_info.personal_info.location', 'Personal - Location'),
    ('candidate_info.personal_info.introduction_aboutme', 'candidate_info.personal_info.introduction_aboutme', 'Personal - About Me'),
    ('candidate_info.contact_info.email', 'candidate_info.contact_info.email', 'Contact - Email'),
    ('candidate_info.contact_info.phone', 'candidate_info.contact_info.phone', 'Contact - Phone'),
    ('candidate_info.education', 'candidate_info.education', 'Education History (Array)'),
    ('candidate_info.experience', 'candidate_info.experience', 'Experience (Array)'),
    ('candidate_info.skills', 'candidate_info.skills', 'Skills (Array)'),
    ('candidate_info.job_suitable', 'candidate_info.job_suitable', 'Job Suitability (Array)'),
    ('jobs', 'jobs', 'Job Matches from n8n (Array of N8NJobMatch)'),
    ('job_applied.job_id', 'job_applied.job_id', 'Applied Job - ID'),
    ('job_applied.job_title', 'job_applied.job_title', 'Applied Job - Title'),
    ('job_applied.fit_score', 'job_applied.fit_score', 'Applied Job - Fit Score'),
    ('job_applied.justification', 'job_applied.justification', 'Applied Job - Justification (Array)'),
    ('targetPositionId', 'targetPositionId', 'Target Position ID (Hint from Uploader)'),
    ('targetPositionTitle', 'targetPositionTitle', 'Target Position Title (Hint from Uploader)'),
    ('targetPositionDescription', 'targetPositionDescription', 'Target Position Description (Hint from Uploader)'),
    ('targetPositionLevel', 'targetPositionLevel', 'Target Position Level (Hint from Uploader)')
ON CONFLICT (target_path) DO NOTHING;


-- Notification System Tables
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_key TEXT NOT NULL UNIQUE, -- e.g., 'CANDIDATE_CREATED', 'STATUS_UPDATED'
    label TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_key TEXT NOT NULL UNIQUE, -- 'email', 'webhook'
    label TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- e.g., { webhookUrl: '...' } for webhook channel
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, channel_id)
);

-- Seed Notification Events & Channels (idempotent)
INSERT INTO "NotificationEvent" (event_key, label, description) VALUES
    ('CANDIDATE_CREATED', 'New Candidate Created', 'Triggered when a new candidate profile is created.'),
    ('CANDIDATE_STATUS_UPDATED', 'Candidate Status Updated', 'Triggered when a candidate''s recruitment stage changes.'),
    ('CANDIDATE_ASSIGNED', 'Candidate Assigned to Recruiter', 'Triggered when a candidate is assigned to a recruiter.'),
    ('POSITION_CREATED', 'New Position Added', 'Triggered when a new job position is added.'),
    ('POSITION_STATUS_CHANGED', 'Position Status Changed', 'Triggered when a job position is opened or closed.')
ON CONFLICT (event_key) DO NOTHING;

INSERT INTO "NotificationChannel" (channel_key, label) VALUES
    ('email', 'Email Notification'),
    ('webhook', 'Webhook Notification')
ON CONFLICT (channel_key) DO NOTHING;

-- Functions to update "updatedAt" timestamp automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updatedAt' AND table_schema = 'public' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON %I;', t_name);
        EXECUTE format('CREATE TRIGGER set_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();', t_name);
    END LOOP;
END
$$;

-- Log successful completion of the script
INSERT INTO "LogEntry" (level, message, source) VALUES ('INFO', 'Database schema initialized/verified successfully.', 'init-db.sql')
ON CONFLICT DO NOTHING;

COMMIT;
    
