-- init-db.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stores hashed password
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Insert default admin user (replace with your actual hashed password if you change it)
-- To generate a hash for 'nccadmin':
-- const bcrypt = require('bcrypt');
-- const saltRounds = 10;
-- const plaintextPassword = 'nccadmin'; 
-- bcrypt.hash(plaintextPassword, saltRounds, function(err, hash) { console.log(hash); });
-- Example hash for 'nccadmin': $2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly (this is just an example, generate your own if needed)
INSERT INTO "User" (id, name, email, password, role, "modulePermissions") VALUES 
('213d289f-31ef-47cb-bf13-8e7207295b42', 'Admin User', 'admin@ncc.com', '$2a$10$dwiCxbUtCqnXeB2O8BmiyeWHL0e7rOqahafQAUACsnD4EZ9nGqPx2', 'Admin', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW']::TEXT[])
ON CONFLICT (email) DO NOTHING;

-- MIGRATION: Rename old tables if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Position') THEN
    ALTER TABLE "Position" RENAME TO "positions";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Candidate') THEN
    ALTER TABLE "Candidate" RENAME TO "candidates";
  END IF;
END $$;

-- Create positions table
CREATE TABLE IF NOT EXISTS "positions" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    position_level VARCHAR(100),
    "customAttributes" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_positions_title ON "positions"(title);

-- Create RecruitmentStage table if it doesn't exist
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recruitment_stage_name ON "RecruitmentStage"(name);
CREATE INDEX IF NOT EXISTS idx_recruitment_stage_sort_order ON "RecruitmentStage"(sort_order);


-- Insert default system recruitment stages
INSERT INTO "RecruitmentStage" (id, name, description, is_system, sort_order) VALUES 
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
-- Create candidates table
CREATE TABLE IF NOT EXISTS "candidates" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "positionId" UUID REFERENCES "positions"(id) ON DELETE SET NULL,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Applied',
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB,
    "customAttributes" JSONB DEFAULT '{}',
    "resumePath" VARCHAR(1024),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "avatarUrl" VARCHAR(1024)
);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON "candidates"(email);
CREATE INDEX IF NOT EXISTS idx_candidates_position_id ON "candidates"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter_id ON "candidates"("recruiterId");

CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "candidates"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(50) NOT NULL,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transition_candidate_id ON "TransitionRecord"("candidateId");

CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_log_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_log_timestamp ON "LogEntry"(timestamp);

-- Create UserGroup table
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_default BOOLEAN DEFAULT FALSE,
    is_system_role BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usergroup_name ON "UserGroup"(name);

-- Create User_UserGroup join table
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);
CREATE INDEX IF NOT EXISTS idx_user_usergroup_userid ON "User_UserGroup"("userId");
CREATE INDEX IF NOT EXISTS idx_user_usergroup_groupid ON "User_UserGroup"("groupId");

-- Create SystemSetting table for global app/system settings
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_systemsetting_key ON "SystemSetting"(key);

-- Create WebhookFieldMapping table for webhook payload mappings
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_path VARCHAR(255) NOT NULL,
  source_path VARCHAR(255),
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhook_target_path ON "WebhookFieldMapping"(target_path);

-- Notification Events (types of events that can trigger notifications)
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_key VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Channels (ways to notify: email, webhook, etc.)
CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_key VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Settings (which events are enabled for which channels)
CREATE TABLE IF NOT EXISTS "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    configuration JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, channel_id)
);

-- Seed default notification channels
INSERT INTO "NotificationChannel" (channel_key, label)
VALUES ('email', 'Email'), ('webhook', 'Webhook')
ON CONFLICT (channel_key) DO NOTHING;

-- Seed example notification events
INSERT INTO "NotificationEvent" (event_key, label, description)
VALUES
  ('candidate_created', 'Candidate Created', 'Triggered when a new candidate is created.'),
  ('position_filled', 'Position Filled', 'Triggered when a position is filled.'),
  ('stage_changed', 'Stage Changed', 'Triggered when a candidate changes recruitment stage.')
ON CONFLICT (event_key) DO NOTHING;

-- Seed default user groups (roles) and permissions
INSERT INTO "UserGroup" (id, name, description, permissions, is_default, is_system_role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'], true, true),
  ('00000000-0000-0000-0000-000000000002', 'Recruiter', 'Can manage candidates and positions', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','RECRUITMENT_STAGES_MANAGE'], true, false),
  ('00000000-0000-0000-0000-000000000003', 'Hiring Manager', 'Can view candidates and positions', ARRAY['CANDIDATES_VIEW','POSITIONS_VIEW'], true, false)
ON CONFLICT (name) DO NOTHING;

-- Assign default admin user to Admin group
INSERT INTO "User_UserGroup" ("userId", "groupId")
VALUES ('213d289f-31ef-47cb-bf13-8e7207295b42', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Ensure candidates table has avatarUrl column for profile images
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'avatarUrl') THEN
    ALTER TABLE "candidates" ADD COLUMN "avatarUrl" VARCHAR(1024);
  END IF;
END $$;
