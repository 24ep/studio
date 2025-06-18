-- PostgreSQL Initialization Script for CandiTrack Candidate Matching App

-- Drop existing tables (optional, for clean setup during development)
-- For production, use migrations.
DROP TABLE IF EXISTS "SystemSetting" CASCADE;
DROP TABLE IF EXISTS "UserUIDisplayPreference" CASCADE;
DROP TABLE IF EXISTS "WebhookFieldMapping" CASCADE;
DROP TABLE IF EXISTS "CustomFieldDefinition" CASCADE;
DROP TABLE IF EXISTS "NotificationSetting" CASCADE;
DROP TABLE IF EXISTS "NotificationChannel" CASCADE;
DROP TABLE IF EXISTS "NotificationEvent" CASCADE;
DROP TABLE IF EXISTS "User_UserGroup" CASCADE;
DROP TABLE IF EXISTS "UserGroup_PlatformModule" CASCADE;
DROP TABLE IF EXISTS "UserGroup" CASCADE;
DROP TABLE IF EXISTS "TransitionRecord" CASCADE;
DROP TABLE IF EXISTS "ResumeHistory" CASCADE;
DROP TABLE IF EXISTS "Candidate" CASCADE;
DROP TABLE IF EXISTS "Position" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "LogEntry" CASCADE;
DROP TABLE IF EXISTS "PlatformModule" CASCADE;
DROP TABLE IF EXISTS "RecruitmentStage" CASCADE;

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Storing bcrypt hash
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(512),
    "dataAiHint" VARCHAR(100),
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create UserGroup table (represents Roles in the UI)
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_system_role BOOLEAN DEFAULT FALSE, -- True for Admin, Recruiter, Hiring Manager default roles
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create PlatformModule table (predefined list of permissions)
CREATE TABLE IF NOT EXISTS "PlatformModule" (
    id TEXT PRIMARY KEY, -- e.g., 'CANDIDATES_VIEW'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL
);

-- Create User_UserGroup join table (many-to-many for users and groups/roles)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- Create UserGroup_PlatformModule join table (many-to-many for groups/roles and permissions)
CREATE TABLE IF NOT EXISTS "UserGroup_PlatformModule" (
    group_id UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES "PlatformModule"(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, permission_id)
);

-- Create Position table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level VARCHAR(100), -- e.g., Senior, Mid-Level, L3
    custom_attributes JSONB, -- For custom fields
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Candidate table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "avatarUrl" VARCHAR(512),
    "dataAiHint" VARCHAR(100),
    "resumePath" VARCHAR(512), -- Path to resume in MinIO
    "parsedData" JSONB,
    custom_attributes JSONB, -- For custom fields
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0 CHECK ("fitScore" >= 0 AND "fitScore" <= 100),
    status VARCHAR(100) NOT NULL, -- Current stage in pipeline
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ResumeHistory table
CREATE TABLE IF NOT EXISTS "ResumeHistory" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    "filePath" VARCHAR(512) NOT NULL, -- Path to the resume file in MinIO
    "originalFileName" VARCHAR(255) NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL
);

-- Create RecruitmentStage table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for core, un-deletable stages
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create TransitionRecord table (tracks candidate status changes)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(100) NOT NULL, -- References RecruitmentStage.name
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create LogEntry table
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source VARCHAR(100),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create CustomFieldDefinition table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL CHECK (model_name IN ('Candidate', 'Position')),
    field_key VARCHAR(100) NOT NULL, -- e.g., 'linkedin_url', 'expected_salary'
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple')),
    options JSONB, -- For select types, array of { value: string, label: string }
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key) -- Ensure field keys are unique per model
);

-- Create SystemSetting table (for global app preferences)
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create UserUIDisplayPreference table (user-specific UI settings)
CREATE TABLE IF NOT EXISTS "UserUIDisplayPreference" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('Candidate', 'Position')),
    attribute_key VARCHAR(255) NOT NULL, -- e.g., 'name', 'parsedData.education.university'
    ui_preference VARCHAR(50) NOT NULL CHECK (ui_preference IN ('Standard', 'Emphasized', 'Hidden')),
    custom_note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", model_type, attribute_key)
);

-- Create WebhookFieldMapping table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_path VARCHAR(255) UNIQUE NOT NULL, -- Path in CandiTrack's CandidateDetails
    source_path VARCHAR(255),               -- Path in incoming JSON payload
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification System Tables
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'CANDIDATE_CREATED', 'STATUS_UPDATED'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'email', 'webhook'
    label VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- e.g., { "webhookUrl": "..." } for webhook channel
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, channel_id)
);

-- Insert initial data (default admin, roles, stages, permissions, etc.)
-- Default Admin User
INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint")
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for default admin
    'Admin User',
    'admin@ncc.com',
    '$2b$10$hA1.yqgH8z.y5qR0/nCg9ON4X/9q5RjZ10Q5n5XlO6fC6g4.G9hXy', -- Hash for 'nccadmin'
    'Admin',
    'https://placehold.co/100x100.png',
    'profile person'
) ON CONFLICT (email) DO NOTHING;

-- Populate PlatformModule table
INSERT INTO "PlatformModule" (id, label, description, category) VALUES
('CANDIDATES_VIEW', 'View Candidates', 'Allows viewing candidate profiles and lists.', 'Candidate Management'),
('CANDIDATES_MANAGE', 'Manage Candidates', 'Allows adding, editing, and deleting candidate profiles.', 'Candidate Management'),
('CANDIDATES_IMPORT', 'Import Candidates', 'Allows bulk importing of candidate data.', 'Candidate Management'),
('CANDIDATES_EXPORT', 'Export Candidates', 'Allows bulk exporting of candidate data.', 'Candidate Management'),
('POSITIONS_VIEW', 'View Positions', 'Allows viewing job position details and lists.', 'Position Management'),
('POSITIONS_MANAGE', 'Manage Positions', 'Allows adding, editing, and deleting job positions.', 'Position Management'),
('POSITIONS_IMPORT', 'Import Positions', 'Allows bulk importing of position data.', 'Position Management'),
('POSITIONS_EXPORT', 'Export Positions', 'Allows bulk exporting of position data.', 'Position Management'),
('USERS_MANAGE', 'Manage Users', 'Allows managing user accounts and their direct permissions (typically Admin only).', 'User Access Control'),
('USER_GROUPS_MANAGE', 'Manage Roles (Groups)', 'Allows managing user groups (roles) and their assigned permissions.', 'User Access Control'),
('SYSTEM_SETTINGS_MANAGE', 'Manage System Preferences', 'Allows managing global system settings like App Name, Logo, SMTP.', 'System Configuration'),
('USER_PREFERENCES_MANAGE', 'Manage Own UI Preferences', 'Allows users to manage their own UI display preferences for data models.', 'System Configuration'),
('RECRUITMENT_STAGES_MANAGE', 'Manage Recruitment Stages', 'Allows managing the stages in the recruitment pipeline.', 'System Configuration'),
('CUSTOM_FIELDS_MANAGE', 'Manage Custom Fields', 'Allows defining custom data fields for candidates and positions.', 'System Configuration'),
('WEBHOOK_MAPPING_MANAGE', 'Manage Webhook Mappings', 'Allows configuring mappings for incoming webhook payloads.', 'System Configuration'),
('NOTIFICATION_SETTINGS_MANAGE', 'Manage Notification Settings', 'Allows configuring system notification events and channels.', 'System Configuration'),
('LOGS_VIEW', 'View Application Logs', 'Allows viewing system and audit logs.', 'Logging & Audit')
ON CONFLICT (id) DO NOTHING;


-- Default User Groups (Roles)
INSERT INTO "UserGroup" (id, name, description, is_default, is_system_role) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access.', FALSE, TRUE),
('00000000-0000-0000-0000-000000000002', 'Recruiter', 'Access to candidate and position management.', TRUE, TRUE),
('00000000-0000-0000-0000-000000000003', 'Hiring Manager', 'Limited access for reviewing candidates.', FALSE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Assign default admin to 'Admin' group
INSERT INTO "User_UserGroup" ("userId", "groupId") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000001')
ON CONFLICT ("userId", "groupId") DO NOTHING;

-- Default permissions for Admin Role
INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
('00000000-0000-0000-0000-000000000001', 'CANDIDATES_VIEW'),
('00000000-0000-0000-0000-000000000001', 'CANDIDATES_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'CANDIDATES_IMPORT'),
('00000000-0000-0000-0000-000000000001', 'CANDIDATES_EXPORT'),
('00000000-0000-0000-0000-000000000001', 'POSITIONS_VIEW'),
('00000000-0000-0000-0000-000000000001', 'POSITIONS_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'POSITIONS_IMPORT'),
('00000000-0000-0000-0000-000000000001', 'POSITIONS_EXPORT'),
('00000000-0000-0000-0000-000000000001', 'USERS_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'USER_GROUPS_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'SYSTEM_SETTINGS_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'USER_PREFERENCES_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'RECRUITMENT_STAGES_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'CUSTOM_FIELDS_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'WEBHOOK_MAPPING_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'NOTIFICATION_SETTINGS_MANAGE'),
('00000000-0000-0000-0000-000000000001', 'LOGS_VIEW')
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Default permissions for Recruiter Role
INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
('00000000-0000-0000-0000-000000000002', 'CANDIDATES_VIEW'),
('00000000-0000-0000-0000-000000000002', 'CANDIDATES_MANAGE'),
('00000000-0000-0000-0000-000000000002', 'CANDIDATES_IMPORT'),
('00000000-0000-0000-0000-000000000002', 'CANDIDATES_EXPORT'),
('00000000-0000-0000-0000-000000000002', 'POSITIONS_VIEW'),
('00000000-0000-0000-0000-000000000002', 'POSITIONS_MANAGE'),
('00000000-0000-0000-0000-000000000002', 'POSITIONS_IMPORT'),
('00000000-0000-0000-0000-000000000002', 'POSITIONS_EXPORT'),
('00000000-0000-0000-0000-000000000002', 'USER_PREFERENCES_MANAGE')
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Default permissions for Hiring Manager Role
INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
('00000000-0000-0000-0000-000000000003', 'CANDIDATES_VIEW'), -- Can view candidates (likely filtered by assignment)
('00000000-0000-0000-0000-000000000003', 'POSITIONS_VIEW'),
('00000000-0000-0000-0000-000000000003', 'USER_PREFERENCES_MANAGE')
ON CONFLICT (group_id, permission_id) DO NOTHING;


-- Default Recruitment Stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Candidate has applied for the position.', TRUE, 10),
('Screening', 'Initial screening of the application.', TRUE, 20),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 30),
('Interview Scheduled', 'Interview has been scheduled with the candidate.', TRUE, 40),
('Interviewing', 'Candidate is currently in the interview process.', TRUE, 50),
('Offer Extended', 'An offer has been extended to the candidate.', TRUE, 60),
('Offer Accepted', 'Candidate has accepted the offer.', TRUE, 70),
('Hired', 'Candidate has been hired.', TRUE, 80),
('Rejected', 'Candidate has been rejected.', TRUE, 90),
('On Hold', 'Candidate application is temporarily on hold.', TRUE, 100)
ON CONFLICT (name) DO NOTHING;

-- Default System Settings
INSERT INTO "SystemSetting" (key, value) VALUES
('appName', 'CandiTrack'),
('appThemePreference', 'system'),
('primaryGradientStart', '179 67% 66%'),
('primaryGradientEnd', '238 74% 61%'),
('loginPageBackgroundType', 'default'),
('sidebarBgStartL', '220 25% 97%'), ('sidebarBgEndL', '220 20% 94%'), ('sidebarTextL', '220 25% 30%'),
('sidebarActiveBgStartL', '179 67% 66%'), ('sidebarActiveBgEndL', '238 74% 61%'), ('sidebarActiveTextL', '0 0% 100%'),
('sidebarHoverBgL', '220 10% 92%'), ('sidebarHoverTextL', '220 25% 25%'), ('sidebarBorderL', '220 15% 85%'),
('sidebarBgStartD', '220 15% 12%'), ('sidebarBgEndD', '220 15% 9%'), ('sidebarTextD', '210 30% 85%'),
('sidebarActiveBgStartD', '179 67% 66%'), ('sidebarActiveBgEndD', '238 74% 61%'), ('sidebarActiveTextD', '0 0% 100%'),
('sidebarHoverBgD', '220 15% 20%'), ('sidebarHoverTextD', '210 30% 90%'), ('sidebarBorderD', '220 15% 18%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Default Notification Events
INSERT INTO "NotificationEvent" (id, event_key, label, description) VALUES
(gen_random_uuid(), 'CANDIDATE_CREATED', 'New Candidate Created', 'Triggered when a new candidate profile is created.'),
(gen_random_uuid(), 'CANDIDATE_STATUS_UPDATED', 'Candidate Status Updated', 'Triggered when a candidate''s recruitment stage changes.'),
(gen_random_uuid(), 'POSITION_CREATED', 'New Position Added', 'Triggered when a new job position is added.'),
(gen_random_uuid(), 'USER_ASSIGNED_TO_CANDIDATE', 'User Assigned to Candidate', 'Triggered when a recruiter is assigned to a candidate.')
ON CONFLICT (event_key) DO NOTHING;

-- Default Notification Channels
INSERT INTO "NotificationChannel" (id, channel_key, label) VALUES
(gen_random_uuid(), 'email', 'Email Notification'),
(gen_random_uuid(), 'webhook', 'Webhook Notification')
ON CONFLICT (channel_key) DO NOTHING;

-- Default Custom Fields (Examples - admins can add more)
INSERT INTO "CustomFieldDefinition" (model_name, field_key, label, field_type, options, is_required, sort_order) VALUES
('Candidate', 'expected_salary', 'Expected Salary', 'number', NULL, FALSE, 10),
('Candidate', 'notice_period', 'Notice Period (Days)', 'number', NULL, FALSE, 20),
('Candidate', 'work_authorization', 'Work Authorization Status', 'select_single', '[{"value": "citizen", "label": "Citizen/PR"}, {"value": "work_permit", "label": "Requires Work Permit"}, {"value": "needs_sponsorship", "label": "Needs Sponsorship"}]', FALSE, 30),
('Position', 'hiring_manager', 'Hiring Manager (Text)', 'text', NULL, TRUE, 10),
('Position', 'priority_level', 'Priority Level', 'select_single', '[{"value": "high", "label": "High"}, {"value": "medium", "label": "Medium"}, {"value": "low", "label": "Low"}]', FALSE, 20)
ON CONFLICT (model_name, field_key) DO NOTHING;

-- Log a message indicating script completion
INSERT INTO "LogEntry" (level, message, source) VALUES
('INFO', 'Database initialization script completed successfully.', 'init-db.sql');

-- Example: Add some initial webhook mappings (can be managed via UI)
-- These are examples, the actual sourcePath will depend on your n8n workflow output
INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes) VALUES
('candidate_info.personal_info.firstname', 'data.profile.firstName', 'Map first name from n8n payload path data.profile.firstName'),
('candidate_info.personal_info.lastname', 'data.profile.lastName', 'Map last name'),
('candidate_info.contact_info.email', 'data.email', 'Map email'),
('candidate_info.experience', 'data.experienceHistory', 'Map entire experience array'),
('jobs', 'data.matchedJobs', 'Map suggested job matches')
ON CONFLICT (target_path) DO NOTHING;
