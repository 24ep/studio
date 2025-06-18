
-- Initialize the database schema for the Candidate Matching ATS

-- Drop existing tables (optional, for clean slate during development)
-- Make sure to backup data if needed before running this in an environment with existing data.
DROP TABLE IF EXISTS "User_UserGroup" CASCADE;
DROP TABLE IF EXISTS "UserGroup_PlatformModule" CASCADE;
DROP TABLE IF EXISTS "UserGroup" CASCADE;
DROP TABLE IF EXISTS "TransitionRecord" CASCADE;
DROP TABLE IF EXISTS "ResumeHistory" CASCADE;
DROP TABLE IF EXISTS "Candidate" CASCADE;
DROP TABLE IF EXISTS "Position" CASCADE;
DROP TABLE IF EXISTS "RecruitmentStage" CASCADE;
DROP TABLE IF EXISTS "LogEntry" CASCADE;
DROP TABLE IF EXISTS "UserUIDisplayPreference" CASCADE;
DROP TABLE IF EXISTS "WebhookFieldMapping" CASCADE;
DROP TABLE IF EXISTS "CustomFieldDefinition" CASCADE;
DROP TABLE IF EXISTS "SystemSetting" CASCADE;
DROP TABLE IF EXISTS "NotificationSetting" CASCADE;
DROP TABLE IF EXISTS "NotificationChannel" CASCADE;
DROP TABLE IF EXISTS "NotificationEvent" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;


-- User Table
CREATE TABLE "User" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Storing hashed passwords
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
  "avatarUrl" VARCHAR(1024) NULL,
  "dataAiHint" VARCHAR(255) NULL,
  "modulePermissions" TEXT[] NULL, -- Array of PlatformModuleId strings
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Group Table
CREATE TABLE "UserGroup" (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User to User Group Junction Table (Many-to-Many)
CREATE TABLE "User_UserGroup" (
  "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  "groupId" UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
  PRIMARY KEY ("userId", "groupId")
);

-- User Group to Platform Module Permission Junction Table
CREATE TABLE "UserGroup_PlatformModule" (
  group_id UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL, -- Corresponds to PlatformModuleId
  PRIMARY KEY (group_id, permission_id)
);


-- Position Table
CREATE TABLE "Position" (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  description TEXT,
  "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
  position_level VARCHAR(100),
  custom_attributes JSONB NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RecruitmentStage Table
CREATE TABLE "RecruitmentStage" (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE, -- True for predefined, undeletable stages
  sort_order INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Candidate Table
CREATE TABLE "Candidate" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  "avatarUrl" VARCHAR(1024) NULL,
  "dataAiHint" VARCHAR(255) NULL,
  "resumePath" VARCHAR(1024), -- Path to the latest resume file in MinIO
  "parsedData" JSONB, -- For storing structured data from resume parsing
  "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL, -- Candidate can exist without a specific position initially
  "fitScore" INTEGER DEFAULT 0,
  status VARCHAR(100) NOT NULL REFERENCES "RecruitmentStage"(name) ON UPDATE CASCADE, -- Foreign key to stage name
  "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- Assigned recruiter
  custom_attributes JSONB NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- TransitionRecord Table (Tracks candidate status changes)
CREATE TABLE "TransitionRecord" (
  id UUID PRIMARY KEY,
  "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stage VARCHAR(100) NOT NULL REFERENCES "RecruitmentStage"(name) ON UPDATE CASCADE,
  notes TEXT,
  "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who made the change
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ResumeHistory Table
CREATE TABLE "ResumeHistory" (
  id UUID PRIMARY KEY,
  "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
  "filePath" VARCHAR(1024) NOT NULL, -- Path in MinIO
  "originalFileName" VARCHAR(255) NOT NULL,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  CONSTRAINT uq_candidate_filepath UNIQUE ("candidateId", "filePath")
);


-- LogEntry Table (For application and audit logging)
CREATE TABLE "LogEntry" (
  id SERIAL PRIMARY KEY, -- Using SERIAL for simpler auto-incrementing integer ID
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
  message TEXT NOT NULL,
  source VARCHAR(255),
  "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  details JSONB, -- For additional structured log data
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Redundant with timestamp but good for consistency
);

-- UserUIDisplayPreference Table
CREATE TABLE "UserUIDisplayPreference" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('Candidate', 'Position')),
  attribute_key VARCHAR(255) NOT NULL,
  ui_preference VARCHAR(50) NOT NULL CHECK (ui_preference IN ('Standard', 'Emphasized', 'Hidden')),
  custom_note TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", model_type, attribute_key)
);

-- WebhookFieldMapping Table
CREATE TABLE "WebhookFieldMapping" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_path VARCHAR(255) NOT NULL UNIQUE, -- e.g., 'candidate_info.personal_info.firstname'
  source_path VARCHAR(255), -- e.g., 'payload.profile.givenName', can be NULL if unmapped
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CustomFieldDefinition Table
CREATE TABLE "CustomFieldDefinition" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(50) NOT NULL CHECK (model_name IN ('Candidate', 'Position')),
  field_key VARCHAR(100) NOT NULL, -- e.g., 'linkedin_profile', 'salary_expectation'
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple')),
  options JSONB, -- For select types, stores array of {value: string, label: string}
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (model_name, field_key)
);

-- SystemSetting Table
CREATE TABLE "SystemSetting" (
  key VARCHAR(100) PRIMARY KEY, -- e.g., 'appName', 'appLogoDataUrl', 'appThemePreference'
  value TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification System Tables
CREATE TABLE "NotificationEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'CANDIDATE_APPLIED', 'STATUS_CHANGED_TO_INTERVIEW'
  label VARCHAR(255) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "NotificationChannel" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'email', 'webhook'
  label VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "NotificationSetting" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  configuration JSONB, -- For channel-specific settings, e.g., { "webhookUrl": "https://..." }
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, channel_id)
);


-- Insert default admin user (bcrypt hash for 'nccadmin')
-- Generate new hash with: node -e "console.log(require('bcrypt').hashSync('your_new_password', 10))"
INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions")
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User', 'admin@ncc.com', '$2b$10$3bK6.MAfGkUmz.V.OkRjL.u0zSOeSNsTz6TjSjV6wH3H1r.j7G/5m', 'Admin', 'https://placehold.co/100x100.png?text=A', 'profile admin', ARRAY[
  'CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT',
  'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT',
  'USERS_MANAGE', 'USER_GROUPS_MANAGE',
  'SYSTEM_SETTINGS_MANAGE', 'USER_PREFERENCES_MANAGE',
  'RECRUITMENT_STAGES_MANAGE', 'CUSTOM_FIELDS_MANAGE',
  'WEBHOOK_MAPPING_MANAGE', 'LOGS_VIEW'
]);


-- Insert core recruitment stages
INSERT INTO "RecruitmentStage" (id, name, description, is_system, sort_order) VALUES
(gen_random_uuid(), 'Applied', 'Initial stage for new applications.', TRUE, 0),
(gen_random_uuid(), 'Screening', 'Candidates being reviewed by recruiters.', TRUE, 10),
(gen_random_uuid(), 'Shortlisted', 'Candidates selected for further consideration.', TRUE, 20),
(gen_random_uuid(), 'Interview Scheduled', 'Candidates scheduled for an interview.', TRUE, 30),
(gen_random_uuid(), 'Interviewing', 'Candidates currently in the interview process.', TRUE, 40),
(gen_random_uuid(), 'Offer Extended', 'Candidates who have received a job offer.', TRUE, 50),
(gen_random_uuid(), 'Offer Accepted', 'Candidates who have accepted the job offer.', TRUE, 60),
(gen_random_uuid(), 'Hired', 'Candidates who have been hired.', TRUE, 70),
(gen_random_uuid(), 'Rejected', 'Candidates who are no longer under consideration.', TRUE, 80),
(gen_random_uuid(), 'On Hold', 'Candidates whose applications are temporarily paused.', TRUE, 90);

-- Insert default System Settings
INSERT INTO "SystemSetting" (key, value) VALUES
('appName', 'CandiTrack'),
('appLogoDataUrl', NULL), -- No default logo, user can upload
('appThemePreference', 'system')
ON CONFLICT (key) DO NOTHING;

-- Seed Notification Channels
INSERT INTO "NotificationChannel" (id, channel_key, label) VALUES
(gen_random_uuid(), 'email', 'Email Notification'),
(gen_random_uuid(), 'webhook', 'Webhook Notification')
ON CONFLICT (channel_key) DO NOTHING;

-- Seed Notification Events
INSERT INTO "NotificationEvent" (id, event_key, label, description) VALUES
(gen_random_uuid(), 'CANDIDATE_APPLIED', 'New Candidate Applied', 'Triggered when a new candidate record is created in the system.'),
(gen_random_uuid(), 'CANDIDATE_STATUS_CHANGED', 'Candidate Status Changed', 'Triggered when a candidate''s recruitment stage is updated.'),
(gen_random_uuid(), 'CANDIDATE_ASSIGNED_RECRUITER', 'Candidate Assigned to Recruiter', 'Triggered when a candidate is assigned to a specific recruiter.'),
(gen_random_uuid(), 'POSITION_CREATED', 'New Position Created', 'Triggered when a new job position is added.'),
(gen_random_uuid(), 'POSITION_STATUS_CHANGED', 'Position Status Changed', 'Triggered when a job position is opened or closed.')
ON CONFLICT (event_key) DO NOTHING;


-- Optional: Default webhook field mappings can be inserted here if desired.
-- Example:
-- INSERT INTO "WebhookFieldMapping" (target_path, source_path, notes) VALUES
-- ('candidate_info.personal_info.firstname', 'payload.firstName', 'Maps incoming firstName to candidate''s first name.');

-- End of script
SELECT 'Database schema initialized successfully.' as message;
    
    