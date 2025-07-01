-- =============================
-- CandiTrack Initial Database Schema and Seed (Full Version)
-- =============================

-- ========== SCHEMA ========== --

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Table
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  "avatarUrl" TEXT,
  image TEXT,
  "dataAiHint" TEXT,
  "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "authenticationMethod" TEXT DEFAULT 'basic',
  "forcePasswordChange" BOOLEAN DEFAULT FALSE,
  "emailVerified" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Position Table
CREATE TABLE "Position" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  "isOpen" BOOLEAN DEFAULT TRUE,
  "position_level" TEXT,
  "customAttributes" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Candidate Table
CREATE TABLE "Candidate" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  "positionId" UUID,
  "recruiterId" UUID,
  "fitScore" INT DEFAULT 0,
  status TEXT DEFAULT 'Applied',
  "applicationDate" TIMESTAMP DEFAULT NOW(),
  "parsedData" JSONB,
  "customAttributes" JSONB DEFAULT '{}'::jsonb,
  "resumePath" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "avatarUrl" TEXT,
  "dataAiHint" TEXT,
  CONSTRAINT fk_candidate_position FOREIGN KEY ("positionId") REFERENCES "Position"(id) ON DELETE SET NULL,
  CONSTRAINT fk_candidate_recruiter FOREIGN KEY ("recruiterId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- RecruitmentStage Table
CREATE TABLE "RecruitmentStage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  "isSystem" BOOLEAN,
  "sortOrder" INT
);

-- TransitionRecord Table
CREATE TABLE "TransitionRecord" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "candidateId" UUID NOT NULL,
  "positionId" UUID,
  date TIMESTAMP DEFAULT NOW(),
  stage TEXT NOT NULL,
  notes TEXT,
  "actingUserId" UUID,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_transition_candidate FOREIGN KEY ("candidateId") REFERENCES "Candidate"(id) ON DELETE CASCADE,
  CONSTRAINT fk_transition_position FOREIGN KEY ("positionId") REFERENCES "Position"(id) ON DELETE SET NULL,
  CONSTRAINT fk_transition_user FOREIGN KEY ("actingUserId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- LogEntry Table
CREATE TABLE "LogEntry" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  "actingUserId" UUID,
  details JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_logentry_user FOREIGN KEY ("actingUserId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- AuditLog Table
CREATE TABLE "AuditLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  "actingUserId" UUID,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID,
  action TEXT,
  entity TEXT,
  entity_id TEXT,
  CONSTRAINT fk_auditlog_user FOREIGN KEY ("actingUserId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- UserGroup Table
CREATE TABLE "UserGroup" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isDefault" BOOLEAN DEFAULT FALSE,
  "isSystemRole" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- User_UserGroup Table
CREATE TABLE "User_UserGroup" (
  "userId" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  PRIMARY KEY ("userId", "groupId"),
  CONSTRAINT fk_usergroup_user FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT fk_usergroup_group FOREIGN KEY ("groupId") REFERENCES "UserGroup"(id) ON DELETE CASCADE
);

-- SystemSetting Table
CREATE TABLE "SystemSetting" (
  key TEXT PRIMARY KEY,
  value TEXT,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- WebhookFieldMapping Table
CREATE TABLE "WebhookFieldMapping" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "target_path" TEXT NOT NULL,
  "source_path" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- NotificationEvent Table
CREATE TABLE "NotificationEvent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "eventKey" TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- NotificationChannel Table
CREATE TABLE "NotificationChannel" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "channelKey" TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- NotificationSetting Table
CREATE TABLE "NotificationSetting" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "event_id" UUID NOT NULL,
  "channel_id" UUID NOT NULL,
  "is_enabled" BOOLEAN DEFAULT FALSE,
  configuration JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_notificationsetting_event FOREIGN KEY ("event_id") REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
  CONSTRAINT fk_notificationsetting_channel FOREIGN KEY ("channel_id") REFERENCES "NotificationChannel"(id) ON DELETE CASCADE
);

-- CustomFieldDefinition Table
CREATE TABLE "CustomFieldDefinition" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "model_name" TEXT NOT NULL,
  "field_key" TEXT NOT NULL,
  label TEXT NOT NULL,
  "field_type" TEXT NOT NULL,
  options JSONB,
  "is_required" BOOLEAN DEFAULT FALSE,
  "sort_order" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("model_name", "field_key")
);

-- JobMatch Table
CREATE TABLE "JobMatch" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "candidateId" UUID NOT NULL,
  "jobId" TEXT,
  "job_title" TEXT,
  "fit_score" INT,
  "match_reasons" TEXT[],
  "job_description_summary" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_jobmatch_candidate FOREIGN KEY ("candidateId") REFERENCES "Candidate"(id) ON DELETE CASCADE
);

-- UploadQueue Table
CREATE TABLE "upload_queue" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "file_name" TEXT NOT NULL,
  "file_size" BIGINT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  "error_details" TEXT,
  source TEXT,
  "upload_date" TIMESTAMP DEFAULT NOW(),
  "completed_date" TIMESTAMP,
  "upload_id" TEXT,
  "created_by" UUID,
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "file_path" TEXT NOT NULL,
  "webhook_payload" JSONB,
  "webhook_response" JSONB,
  CONSTRAINT fk_uploadqueue_user FOREIGN KEY ("created_by") REFERENCES "User"(id) ON DELETE SET NULL
);

-- ResumeHistory Table
CREATE TABLE "ResumeHistory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "candidateId" UUID NOT NULL,
  "file_path" TEXT NOT NULL,
  "original_file_name" TEXT NOT NULL,
  "uploaded_at" TIMESTAMP DEFAULT NOW(),
  "uploaded_by_user_id" UUID,
  "uploaded_by_user_name" TEXT,
  CONSTRAINT fk_resumehistory_candidate FOREIGN KEY ("candidateId") REFERENCES "Candidate"(id) ON DELETE CASCADE,
  CONSTRAINT fk_resumehistory_user FOREIGN KEY ("uploaded_by_user_id") REFERENCES "User"(id) ON DELETE SET NULL
);

-- UserUIDisplayPreference Table
CREATE TABLE "UserUIDisplayPreference" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "model_type" TEXT NOT NULL,
  "attribute_key" TEXT NOT NULL,
  "ui_preference" TEXT NOT NULL,
  "custom_note" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_uidisplaypref_user FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE ("userId", "model_type", "attribute_key")
);

-- Account Table
CREATE TABLE "Account" (
  id TEXT PRIMARY KEY,
  "userId" UUID NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  CONSTRAINT fk_account_user FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE (provider, "providerAccountId"),
  INDEX ("userId")
);

-- DataModel Table
CREATE TABLE "DataModel" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  modelType TEXT NOT NULL,
  description TEXT,
  schema JSONB,
  isActive BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- SystemPreference Table
CREATE TABLE "SystemPreference" (
  key TEXT PRIMARY KEY,
  value TEXT,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ========== SEED DATA ========== --

-- Create default admin user (password: nccadmin)
INSERT INTO "User" (id, name, email, password, role, "modulePermissions", "authenticationMethod", "forcePasswordChange", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@ncc.com',
  '$2a$10$dwiCxbUtCqnXeB2O8BmiyeWHL0e7rOqahafQAUACsnD4EZ9nGqPx2',
  'Admin',
  ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'],
  'basic',
  false,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create default positions
INSERT INTO "Position" (id, title, department, description, "isOpen", "createdAt", "updatedAt")
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Software Engineer', 'Engineering', 'Develops and maintains software.', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Product Manager', 'Product', 'Oversees product development.', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create default recruitment stages
INSERT INTO "RecruitmentStage" (id, name, description, "isSystem", "sortOrder")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Applied', 'Candidate has submitted their application', true, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Screening', 'Initial screening of candidate qualifications', true, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Shortlisted', 'Candidate has been shortlisted for further consideration', true, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Interview Scheduled', 'Interview has been scheduled with the candidate', true, 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Interviewing', 'Candidate is currently in the interview process', true, 5),
  ('550e8400-e29b-41d4-a716-446655440006', 'Offer Extended', 'Job offer has been extended to the candidate', true, 6),
  ('550e8400-e29b-41d4-a716-446655440007', 'Offer Accepted', 'Candidate has accepted the job offer', true, 7),
  ('550e8400-e29b-41d4-a716-446655440008', 'Hired', 'Candidate has been hired and started employment', true, 8),
  ('550e8400-e29b-41d4-a716-446655440009', 'Rejected', 'Candidate has been rejected from the process', true, 9),
  ('550e8400-e29b-41d4-a716-446655440010', 'On Hold', 'Candidate application is temporarily on hold', true, 10)
ON CONFLICT (name) DO NOTHING;

-- Create default user groups
INSERT INTO "UserGroup" (id, name, description, permissions, "isDefault", "isSystemRole", "createdAt", "updatedAt")
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'], true, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Recruiter', 'Can manage candidates and positions', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','RECRUITMENT_STAGES_MANAGE'], true, false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Hiring Manager', 'Can view candidates and positions', ARRAY['CANDIDATES_VIEW','POSITIONS_VIEW'], true, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign admin user to Admin group
INSERT INTO "User_UserGroup" ("userId", "groupId")
SELECT u.id, '00000000-0000-0000-0000-000000000001'
FROM "User" u
WHERE u.email = 'admin@ncc.com'
ON CONFLICT ("userId", "groupId") DO NOTHING;

-- Create notification channels
INSERT INTO "NotificationChannel" (id, "channelKey", label, "createdAt", "updatedAt")
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'email', 'Email', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'webhook', 'Webhook', NOW(), NOW())
ON CONFLICT ("channelKey") DO NOTHING;

-- Create notification events
INSERT INTO "NotificationEvent" (id, "eventKey", label, description, "createdAt", "updatedAt")
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'candidate_created', 'Candidate Created', 'Triggered when a new candidate is created.', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000002', 'position_filled', 'Position Filled', 'Triggered when a position is filled.', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000003', 'stage_changed', 'Stage Changed', 'Triggered when a candidate changes recruitment stage.', NOW(), NOW())
ON CONFLICT ("eventKey") DO NOTHING; 