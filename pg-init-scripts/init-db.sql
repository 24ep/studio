
-- Ensure the database and schema exist (handled by Docker Compose and PostgreSQL defaults)
-- Create tables if they don't exist

-- User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "modulePermissions" TEXT[] DEFAULT '{}', -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- UserGroup (Roles) table
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_system_role BOOLEAN DEFAULT FALSE, -- True for Admin, Recruiter, Hiring Manager defaults
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Join table for User and UserGroup (many-to-many for roles/groups)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- Join table for UserGroup (Roles) and PlatformModule (permissions)
CREATE TABLE IF NOT EXISTS "UserGroup_PlatformModule" (
    group_id UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL, -- Corresponds to PlatformModuleId
    PRIMARY KEY (group_id, permission_id)
    -- No direct FK to a PlatformModule table, as permissions are code-defined
);


-- Position table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level VARCHAR(100),
    custom_attributes JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment Stage table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for default/core stages
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "resumePath" TEXT, -- Path to resume file in MinIO
    "parsedData" JSONB, -- Store structured data from resume parsing
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(100) REFERENCES "RecruitmentStage"(name) ON DELETE RESTRICT,
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    custom_attributes JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transition Record table
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID REFERENCES "Candidate"(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(100) REFERENCES "RecruitmentStage"(name) ON DELETE RESTRICT NOT NULL,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Log Entry table
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User performing the action
    details JSONB, -- For structured log data
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For log entry creation time itself
);

-- Custom Field Definition table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL CHECK (model_name IN ('Candidate', 'Position')),
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple')),
    options JSONB, -- For select types, array of {value: string, label: string}
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key)
);

-- System Settings table
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User UI Display Preferences table
CREATE TABLE IF NOT EXISTS "UserUIDisplayPreference" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('Candidate', 'Position')),
    attribute_key VARCHAR(255) NOT NULL, -- e.g., 'name', 'parsedData.personal_info.location'
    ui_preference VARCHAR(50) NOT NULL CHECK (ui_preference IN ('Standard', 'Emphasized', 'Hidden')),
    custom_note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", model_type, attribute_key)
);

-- Webhook Field Mapping table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_path VARCHAR(255) UNIQUE NOT NULL, -- Path in CandiTrack model (e.g., 'personal_info.firstname')
    source_path VARCHAR(255), -- Path in incoming JSON (e.g., 'data.profile.firstName')
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Events table
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'CANDIDATE_CREATED', 'STATUS_UPDATED'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Channels table
CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_key VARCHAR(50) UNIQUE NOT NULL CHECK (channel_key IN ('email', 'webhook')),
    label VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Settings table (links events to channels and their configs)
CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES "NotificationEvent"(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES "NotificationChannel"(id) ON DELETE CASCADE NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- For webhook URL, email templates, etc.
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, channel_id)
);

-- Resume History table
CREATE TABLE IF NOT EXISTS "ResumeHistory" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID REFERENCES "Candidate"(id) ON DELETE CASCADE NOT NULL,
    "filePath" TEXT NOT NULL, -- Path in MinIO
    "originalFileName" VARCHAR(255) NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who uploaded this version
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Insert default admin user (ensure bcrypt hash is generated for 'nccadmin')
-- Example hash for 'nccadmin': $2b$10$YourGeneratedBcryptHashHere (replace with actual hash)
-- To generate: require('bcrypt').hashSync('nccadmin', 10)
INSERT INTO "User" (name, email, password, role)
VALUES ('Admin User', 'admin@ncc.com', '$2a$10$zONW1TLkiTD1TUa11NpuOufsVSt4dra4RFdfp2XjXajv4yW1aWM8.', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default User Groups (Roles)
INSERT INTO "UserGroup" (name, description, is_system_role) VALUES
('Admin', 'System Administrators with full access.', TRUE),
('Recruiter', 'Recruiters managing candidates and positions.', TRUE),
('Hiring Manager', 'Managers involved in hiring decisions.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to Admin group (example, add all relevant ones)
-- This needs to be done carefully based on your defined PLATFORM_MODULES
-- Example of adding a few core permissions to Admin UserGroup:
DO $$
DECLARE
    admin_group_id UUID;
BEGIN
    SELECT id INTO admin_group_id FROM "UserGroup" WHERE name = 'Admin';
    IF admin_group_id IS NOT NULL THEN
        INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
        (admin_group_id, 'CANDIDATES_VIEW'), (admin_group_id, 'CANDIDATES_MANAGE'), (admin_group_id, 'CANDIDATES_IMPORT'), (admin_group_id, 'CANDIDATES_EXPORT'),
        (admin_group_id, 'POSITIONS_VIEW'), (admin_group_id, 'POSITIONS_MANAGE'), (admin_group_id, 'POSITIONS_IMPORT'), (admin_group_id, 'POSITIONS_EXPORT'),
        (admin_group_id, 'USERS_MANAGE'), (admin_group_id, 'USER_GROUPS_MANAGE'),
        (admin_group_id, 'SYSTEM_SETTINGS_MANAGE'), (admin_group_id, 'USER_PREFERENCES_MANAGE'),
        (admin_group_id, 'RECRUITMENT_STAGES_MANAGE'), (admin_group_id, 'CUSTOM_FIELDS_MANAGE'),
        (admin_group_id, 'WEBHOOK_MAPPING_MANAGE'), (admin_group_id, 'NOTIFICATION_SETTINGS_MANAGE'),
        (admin_group_id, 'LOGS_VIEW')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Assign default Recruiter permissions (example)
DO $$
DECLARE
    recruiter_group_id UUID;
BEGIN
    SELECT id INTO recruiter_group_id FROM "UserGroup" WHERE name = 'Recruiter';
    IF recruiter_group_id IS NOT NULL THEN
        INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
        (recruiter_group_id, 'CANDIDATES_VIEW'), (recruiter_group_id, 'CANDIDATES_MANAGE'),
        (recruiter_group_id, 'POSITIONS_VIEW'), (recruiter_group_id, 'POSITIONS_MANAGE'),
        (recruiter_group_id, 'USER_PREFERENCES_MANAGE') -- Recruiters can manage their own UI prefs
        ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- Assign default admin user to Admin group
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

-- Insert default system recruitment stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Candidate has applied for the position.', TRUE, 0),
('Screening', 'Resume and initial screening phase.', TRUE, 10),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 20),
('Interview Scheduled', 'Interview has been scheduled with the candidate.', TRUE, 30),
('Interviewing', 'Candidate is currently in the interview process.', TRUE, 40),
('Offer Extended', 'Job offer has been extended to the candidate.', TRUE, 50),
('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 60),
('Hired', 'Candidate has been hired.', TRUE, 70),
('Rejected', 'Candidate has been rejected.', TRUE, 80),
('On Hold', 'Candidate application is temporarily on hold.', TRUE, 90)
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings (placeholders, can be managed via UI)
INSERT INTO "SystemSetting" (key, value) VALUES
('appName', 'CandiTrack'),
('appLogoDataUrl', NULL), -- No default logo initially
('appThemePreference', 'system'),
('primaryGradientStart', '179 67% 66%'), 
('primaryGradientEnd', '238 74% 61%'),   
('smtpHost', ''), ('smtpPort', '587'), ('smtpUser', ''), ('smtpSecure', 'true'), ('smtpFromEmail', ''),
('n8nResumeWebhookUrl', ''), ('n8nGenericPdfWebhookUrl', ''), ('geminiApiKey',''),
('loginPageBackgroundType', 'default'), ('loginPageBackgroundImageUrl', NULL), ('loginPageBackgroundColor1', '#F0F4F7'), ('loginPageBackgroundColor2', '#3F51B5'),
('sidebarBgStartL', '220 25% 97%'), ('sidebarBgEndL', '220 20% 94%'), ('sidebarTextL', '220 25% 30%'),
('sidebarActiveBgStartL', '179 67% 66%'), ('sidebarActiveBgEndL', '238 74% 61%'), ('sidebarActiveTextL', '0 0% 100%'),
('sidebarHoverBgL', '220 10% 92%'), ('sidebarHoverTextL', '220 25% 25%'), ('sidebarBorderL', '220 15% 85%'),
('sidebarBgStartD', '220 15% 12%'), ('sidebarBgEndD', '220 15% 9%'), ('sidebarTextD', '210 30% 85%'),
('sidebarActiveBgStartD', '179 67% 66%'), ('sidebarActiveBgEndD', '238 74% 61%'), ('sidebarActiveTextD', '0 0% 100%'),
('sidebarHoverBgD', '220 15% 20%'), ('sidebarHoverTextD', '210 30% 90%'), ('sidebarBorderD', '220 15% 18%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value WHERE "SystemSetting".value IS NULL OR "SystemSetting".value = ''; -- Only update if current value is empty or NULL


-- Insert default Notification Channels
INSERT INTO "NotificationChannel" (channel_key, label) VALUES
('email', 'Email'),
('webhook', 'Webhook')
ON CONFLICT (channel_key) DO NOTHING;

-- Insert default Notification Events (add more as features are implemented)
INSERT INTO "NotificationEvent" (event_key, label, description) VALUES
('CANDIDATE_CREATED', 'New Candidate Created', 'Triggered when a new candidate profile is created in the system.'),
('STATUS_UPDATED', 'Candidate Status Updated', 'Triggered when a candidate''s recruitment stage changes.'),
('NEW_APPLICATION', 'New Job Application', 'Triggered when a candidate applies to a specific job position.'),
('USER_ASSIGNED_TO_CANDIDATE', 'User Assigned to Candidate', 'Triggered when a recruiter is assigned to a candidate.'),
('JOB_CREATED', 'New Job Position Created', 'Triggered when a new job position is added.'),
('JOB_STATUS_CHANGED', 'Job Position Status Changed', 'Triggered when a job position is opened or closed.')
ON CONFLICT (event_key) DO NOTHING;

-- Default Webhook Mappings (empty sourcePath means not mapped by default)
-- Inserting all from TARGET_CANDIDATE_ATTRIBUTES_CONFIG
-- These are just defaults; admin should configure source_path via UI.
INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes) VALUES
('candidate_info.cv_language', NULL, 'Language code of the resume (e.g., EN, TH).'),
('candidate_info.personal_info.title_honorific', NULL, 'E.g., Mr., Ms., Dr.'),
('candidate_info.personal_info.firstname', NULL, 'Candidate''s first name.'),
('candidate_info.personal_info.lastname', NULL, 'Candidate''s last name.'),
('candidate_info.personal_info.nickname', NULL, 'Optional nickname.'),
('candidate_info.personal_info.location', NULL, 'City, Country, etc.'),
('candidate_info.personal_info.introduction_aboutme', NULL, 'Brief introduction or summary.'),
('candidate_info.contact_info.email', NULL, 'Primary email.'),
('candidate_info.contact_info.phone', NULL, 'Primary phone number.'),
('candidate_info.education', NULL, 'Source should be an array of education objects.'),
('candidate_info.experience', NULL, 'Source should be an array of experience objects.'),
('candidate_info.skills', NULL, 'Source should be an array of skill objects/groups.'),
('candidate_info.job_suitable', NULL, 'Source should be an array of job suitability objects.'),
('jobs', NULL, 'Array of suggested job matches from processing.'),
('job_applied.job_id', NULL, 'ID of the job applied for.'),
('job_applied.job_title', NULL, 'Title of the job applied for.'),
('job_applied.fit_score', NULL, 'Fit score for the applied job.'),
('job_applied.justification', NULL, 'Justification for the match score (array of strings).'),
('targetPositionId', NULL, 'Hint from uploader about target position ID.'),
('targetPositionTitle', NULL, 'Hint from uploader about target position title.'),
('targetPositionDescription', NULL, 'Hint from uploader about target position description.'),
('targetPositionLevel', NULL, 'Hint from uploader about target position level.')
ON CONFLICT (target_path) DO NOTHING;


-- Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidate_email ON "Candidate"(email);
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"(status);
CREATE INDEX IF NOT EXISTS idx_candidate_positionId ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidate_recruiterId ON "Candidate"("recruiterId");
CREATE INDEX IF NOT EXISTS idx_position_title ON "Position"(title);
CREATE INDEX IF NOT EXISTS idx_position_department ON "Position"(department);
CREATE INDEX IF NOT EXISTS idx_position_isOpen ON "Position"("isOpen");
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_logentry_actingUserId ON "LogEntry"("actingUserId");
CREATE INDEX IF NOT EXISTS idx_transitionrecord_candidateId ON "TransitionRecord"("candidateId");
CREATE INDEX IF NOT EXISTS idx_transitionrecord_stage ON "TransitionRecord"(stage);
CREATE INDEX IF NOT EXISTS idx_recruitmentstage_sort_order ON "RecruitmentStage"(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_customfielddefinition_model_name ON "CustomFieldDefinition"(model_name);
CREATE INDEX IF NOT EXISTS idx_useruipreference_userId_model_type ON "UserUIDisplayPreference"("userId", model_type);
CREATE INDEX IF NOT EXISTS idx_notificationsetting_event_channel ON "NotificationSetting"(event_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_resumehistory_candidate_id ON "ResumeHistory"("candidateId");


-- End of script
-- Note: For any future schema changes after initial deployment,
-- use a proper migration tool or write idempotent ALTER TABLE scripts.
-- Modifying this init-db.sql script will only affect new database setups
-- where the data volume is empty.
