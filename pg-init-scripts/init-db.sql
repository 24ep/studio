
-- PostgreSQL Initialization Script

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "modulePermissions" TEXT[] DEFAULT '{}', -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Position table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level VARCHAR(100),
    custom_attributes JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Candidate table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "resumePath" VARCHAR(1024), -- Path to resume file in MinIO
    "parsedData" JSONB, -- Store structured data from resume
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(100) NOT NULL DEFAULT 'Applied', -- Default status
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    custom_attributes JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ResumeHistory table
CREATE TABLE IF NOT EXISTS "ResumeHistory" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    "filePath" VARCHAR(1024) NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL
);

-- Create RecruitmentStage table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for predefined system stages
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create TransitionRecord table (for candidate status changes)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(100) NOT NULL, -- Should match a name in RecruitmentStage
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who made the change
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "TransitionRecord"
ADD CONSTRAINT fk_transition_stage
FOREIGN KEY (stage) REFERENCES "RecruitmentStage"(name) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Create LogEntry table
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB, -- For additional structured log data
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Auto-managed by DB
);

-- Create UserGroup table (for Roles)
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE, -- Is this a default group for new users?
    is_system_role BOOLEAN DEFAULT FALSE, -- True for Admin, Recruiter, Hiring Manager (cannot be deleted)
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create User_UserGroup join table (Many-to-Many for Users and Groups)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- Create UserGroup_PlatformModule join table (Many-to-Many for UserGroups and PlatformModules)
CREATE TABLE IF NOT EXISTS "UserGroup_PlatformModule" (
    group_id UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL, -- Corresponds to PlatformModuleId
    PRIMARY KEY (group_id, permission_id)
);


-- Create SystemSetting table
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Create UserUIDisplayPreference table
CREATE TABLE IF NOT EXISTS "UserUIDisplayPreference" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- e.g., 'Candidate', 'Position'
    attribute_key VARCHAR(255) NOT NULL, -- e.g., 'name', 'parsedData.personal_info.location'
    ui_preference VARCHAR(50) NOT NULL CHECK (ui_preference IN ('Standard', 'Emphasized', 'Hidden')),
    custom_note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", model_type, attribute_key)
);

-- Create WebhookFieldMapping table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_path VARCHAR(255) UNIQUE NOT NULL, -- Path in CandiTrack's candidate model
    source_path VARCHAR(255), -- Path in the incoming JSON payload
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create CustomFieldDefinition table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL, -- 'Candidate' or 'Position'
    field_key VARCHAR(100) NOT NULL, -- e.g., 'linkedin_url', 'expected_salary'
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple')),
    options JSONB, -- For select types, array of {value: string, label: string}
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key)
);

-- Notification System Tables
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'candidate.created', 'status.updated'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_key VARCHAR(50) UNIQUE NOT NULL, -- 'email', 'webhook'
    label VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- e.g., { "webhookUrl": "..." }
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, channel_id)
);


-- Insert Default Data

-- Default User Groups (Roles)
INSERT INTO "UserGroup" (id, name, description, is_system_role, "createdAt", "updatedAt") VALUES
('00000000-0000-0000-0000-000000000001', 'Admin', 'System Administrators with full access.', TRUE, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'Recruiter', 'Recruiters managing candidates and positions.', TRUE, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'Hiring Manager', 'Managers involved in hiring decisions.', TRUE, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Default Admin User (ensure bcrypt hash is generated for 'nccadmin')
-- Use a bcrypt hash generator for 'nccadmin' and replace the hash below.
-- Example for 'nccadmin': $2b$10$abcdefghijklmnopqrstuv.abcdefghijklmnopqrstuv.abcdefghijkl
INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Admin', 'admin@ncc.com', '$2b$10$K.ObT5k20N2xKP9WjX8hB.5uWkzoiGT5Xy89jPSc0qpQdTtd5nZUu', 'Admin', 'https://placehold.co/100x100.png?text=A', 'profile person', '{}', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Assign Default Admin to Admin Group
INSERT INTO "User_UserGroup" ("userId", "groupId") VALUES
((SELECT id FROM "User" WHERE email = 'admin@ncc.com'), (SELECT id FROM "UserGroup" WHERE name = 'Admin'))
ON CONFLICT ("userId", "groupId") DO NOTHING;

-- Default Admin Group Permissions (Grant all permissions)
-- CANDIDATES_VIEW, CANDIDATES_MANAGE, CANDIDATES_IMPORT, CANDIDATES_EXPORT,
-- POSITIONS_VIEW, POSITIONS_MANAGE, POSITIONS_IMPORT, POSITIONS_EXPORT,
-- USERS_MANAGE, USER_GROUPS_MANAGE,
-- SYSTEM_SETTINGS_MANAGE, USER_PREFERENCES_MANAGE, RECRUITMENT_STAGES_MANAGE,
-- CUSTOM_FIELDS_MANAGE, WEBHOOK_MAPPING_MANAGE, NOTIFICATION_SETTINGS_MANAGE, LOGS_VIEW
INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id)
SELECT (SELECT id FROM "UserGroup" WHERE name = 'Admin'), permission_id FROM
    (VALUES
        ('CANDIDATES_VIEW'), ('CANDIDATES_MANAGE'), ('CANDIDATES_IMPORT'), ('CANDIDATES_EXPORT'),
        ('POSITIONS_VIEW'), ('POSITIONS_MANAGE'), ('POSITIONS_IMPORT'), ('POSITIONS_EXPORT'),
        ('USERS_MANAGE'), ('USER_GROUPS_MANAGE'),
        ('SYSTEM_SETTINGS_MANAGE'), ('USER_PREFERENCES_MANAGE'), ('RECRUITMENT_STAGES_MANAGE'),
        ('CUSTOM_FIELDS_MANAGE'), ('WEBHOOK_MAPPING_MANAGE'), ('NOTIFICATION_SETTINGS_MANAGE'),
        ('LOGS_VIEW')
    ) AS perms(permission_id)
ON CONFLICT (group_id, permission_id) DO NOTHING;


-- Default Recruiter Group Permissions
INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id)
SELECT (SELECT id FROM "UserGroup" WHERE name = 'Recruiter'), permission_id FROM
    (VALUES
        ('CANDIDATES_VIEW'), ('CANDIDATES_MANAGE'), ('CANDIDATES_IMPORT'), ('CANDIDATES_EXPORT'),
        ('POSITIONS_VIEW'), ('POSITIONS_MANAGE'),
        ('USER_PREFERENCES_MANAGE')
    ) AS perms(permission_id)
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Default Hiring Manager Group Permissions
INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id)
SELECT (SELECT id FROM "UserGroup" WHERE name = 'Hiring Manager'), permission_id FROM
    (VALUES
        ('CANDIDATES_VIEW'), -- Typically can view candidates assigned to them or related to their positions
        ('POSITIONS_VIEW'),
        ('USER_PREFERENCES_MANAGE')
    ) AS perms(permission_id)
ON CONFLICT (group_id, permission_id) DO NOTHING;


-- Insert Default System Recruitment Stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Candidate has applied for the position.', TRUE, 0),
('Screening', 'Candidate resume is being screened by HR.', TRUE, 10),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 20),
('Interview Scheduled', 'Candidate has an interview scheduled.', TRUE, 30),
('Interviewing', 'Candidate is currently in the interview process.', TRUE, 40),
('Offer Extended', 'An offer has been extended to the candidate.', TRUE, 50),
('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 60),
('Hired', 'Candidate has been hired.', TRUE, 70),
('Rejected', 'Candidate has been rejected.', TRUE, 80),
('On Hold', 'Candidate application is currently on hold.', TRUE, 90)
ON CONFLICT (name) DO NOTHING;

-- Default System Settings
INSERT INTO "SystemSetting" (key, value) VALUES
('appName', 'CandiTrack ATS'),
('appLogoDataUrl', NULL), -- No default logo initially
('appThemePreference', 'system'),
('primaryGradientStart', '191 75% 60%'), -- New default (Cyan part of new gradient)
('primaryGradientEnd', '248 87% 36%'),   -- New default (Blue part of new gradient)
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
('loginPageBackgroundColor1', '#F0F4F7'),
('loginPageBackgroundColor2', '#3F51B5'),
('sidebarBgStartL', '220 25% 97%'), ('sidebarBgEndL', '220 20% 94%'), ('sidebarTextL', '220 25% 30%'),
('sidebarActiveBgStartL', '191 75% 60%'), ('sidebarActiveBgEndL', '248 87% 36%'), ('sidebarActiveTextL', '0 0% 100%'),
('sidebarHoverBgL', '220 10% 92%'), ('sidebarHoverTextL', '220 25% 25%'), ('sidebarBorderL', '220 15% 85%'),
('sidebarBgStartD', '220 15% 12%'), ('sidebarBgEndD', '220 15% 9%'), ('sidebarTextD', '210 30% 85%'),
('sidebarActiveBgStartD', '191 75% 60%'), ('sidebarActiveBgEndD', '248 87% 36%'), ('sidebarActiveTextD', '0 0% 100%'),
('sidebarHoverBgD', '220 15% 20%'), ('sidebarHoverTextD', '210 30% 90%'), ('sidebarBorderD', '220 15% 18%')
ON CONFLICT (key) DO NOTHING;

-- Insert Default Notification Events
INSERT INTO "NotificationEvent" (event_key, label, description) VALUES
('candidate.created', 'Candidate Created', 'Triggered when a new candidate profile is created.'),
('candidate.status_updated', 'Candidate Status Updated', 'Triggered when a candidate''s recruitment stage changes.'),
('candidate.assigned', 'Candidate Assigned', 'Triggered when a candidate is assigned to a recruiter.'),
('position.created', 'Position Created', 'Triggered when a new job position is created.'),
('position.status_changed', 'Position Status Changed', 'Triggered when a job position is opened or closed.')
ON CONFLICT (event_key) DO NOTHING;

-- Insert Default Notification Channels
INSERT INTO "NotificationChannel" (channel_key, label) VALUES
('email', 'Email Notification'),
('webhook', 'Webhook Notification')
ON CONFLICT (channel_key) DO NOTHING;


-- Default Webhook Field Mappings (examples, admin can customize)
INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes) VALUES
('candidate_info.cv_language', 'result_json[0].json.cv_language', 'Language of the CV/resume.'),
('candidate_info.personal_info.title_honorific', 'result_json[0].json.personal_info.title_honorific', 'E.g., Mr., Ms., Dr.'),
('candidate_info.personal_info.firstname', 'result_json[0].json.personal_info.firstname', 'Candidate''s first name.'),
('candidate_info.personal_info.lastname', 'result_json[0].json.personal_info.lastname', 'Candidate''s last name.'),
('candidate_info.personal_info.nickname', 'result_json[0].json.personal_info.nickname', 'Optional nickname.'),
('candidate_info.personal_info.location', 'result_json[0].json.personal_info.location', 'City, Country, etc.'),
('candidate_info.personal_info.introduction_aboutme', 'result_json[0].json.personal_info.introduction_aboutme', 'Brief introduction or summary from resume.'),
('candidate_info.contact_info.email', 'result_json[0].json.contact_info.email', 'Primary email from resume.'),
('candidate_info.contact_info.phone', 'result_json[0].json.contact_info.phone', 'Primary phone number from resume.'),
('candidate_info.education', 'result_json[0].json.education', 'Array of education objects. Ensure source matches expected structure.'),
('candidate_info.experience', 'result_json[0].json.experience', 'Array of experience objects. Ensure source matches expected structure.'),
('candidate_info.skills', 'result_json[0].json.skills', 'Array of skill objects/groups. Ensure source matches expected structure.'),
('candidate_info.job_suitable', 'result_json[0].json.job_suitable', 'Array of job suitability objects from resume.'),
('jobs', 'result_json[0].json.jobs', 'Array of job match objects (job_id, job_title, fit_score, match_reasons).'),
('job_applied.job_id', 'result_json[0].json.job_applied.job_id', 'ID of the specific job the candidate applied for (if any).'),
('job_applied.job_title', 'result_json[0].json.job_applied.job_title', 'Title of the specific job applied for.'),
('job_applied.fit_score', 'result_json[0].json.job_applied.fit_score', 'Fit score for the specific job applied for.'),
('job_applied.justification', 'result_json[0].json.job_applied.justification', 'Justification/reasons for the fit score of the applied job (array of strings).'),
('targetPositionId', 'result_json[0].json.targetPositionId', 'Hint for target position ID, if provided by uploader.'),
('targetPositionTitle', 'result_json[0].json.targetPositionTitle', 'Hint for target position title, if provided by uploader.'),
('targetPositionDescription', 'result_json[0].json.targetPositionDescription', 'Hint for target position description, if provided by uploader.'),
('targetPositionLevel', 'result_json[0].json.targetPositionLevel', 'Hint for target position level, if provided by uploader.')
ON CONFLICT (target_path) DO NOTHING;

-- To add more system settings later:
-- INSERT INTO "SystemSetting" (key, value) VALUES ('newSettingKey', 'itsValue') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- To add more default custom fields (examples):
-- INSERT INTO "CustomFieldDefinition" (model_name, field_key, label, field_type, options, is_required, sort_order) VALUES
-- ('Candidate', 'expected_salary', 'Expected Salary', 'number', NULL, FALSE, 10),
-- ('Candidate', 'availability_date', 'Availability Date', 'date', NULL, FALSE, 20),
-- ('Position', 'hiring_manager', 'Hiring Manager Contact', 'text', NULL, TRUE, 5)
-- ON CONFLICT (model_name, field_key) DO NOTHING;


SELECT 'Database initialization script completed.';
