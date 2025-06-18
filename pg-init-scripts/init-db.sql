
-- pg-init-scripts/init-db.sql

-- System Settings Table
CREATE TABLE IF NOT EXISTS "SystemSetting" (
  key TEXT PRIMARY KEY,
  value TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial System Settings (can be managed via UI by Admin later)
INSERT INTO "SystemSetting" (key, value) VALUES
  ('appName', 'CandiTrack'),
  ('appLogoDataUrl', NULL), -- Base64 encoded logo or URL
  ('appThemePreference', 'system'), -- 'light', 'dark', or 'system'
  ('smtpHost', NULL),
  ('smtpPort', NULL), -- e.g., '587'
  ('smtpUser', NULL),
  ('smtpSecure', 'true'), -- 'true' or 'false' for TLS/SSL
  ('smtpFromEmail', NULL), -- Default sender email
  ('n8nResumeWebhookUrl', NULL), -- URL for n8n to process resumes
  ('n8nGenericPdfWebhookUrl', NULL), -- URL for n8n to create candidates from generic PDFs
  ('geminiApiKey', NULL), -- API Key for Google Gemini
  ('loginPageBackgroundType', 'default'), -- 'default', 'image', 'color', 'gradient'
  ('loginPageBackgroundImageUrl', NULL),
  ('loginPageBackgroundColor1', '#F0F4F7'),
  ('loginPageBackgroundColor2', '#3F51B5'),
  -- Sidebar Light Theme Defaults (HSL strings or hex)
  ('sidebarBgStartL', '220 25% 97%'),
  ('sidebarBgEndL', '220 20% 94%'),
  ('sidebarTextL', '220 25% 30%'),
  ('sidebarActiveBgStartL', '206 97% 73%'), -- Corresponds to primary-gradient-start-l
  ('sidebarActiveBgEndL', '244 95% 83%'),   -- Corresponds to primary-gradient-end-l
  ('sidebarActiveTextL', '0 0% 100%'),      -- Corresponds to primary-foreground
  ('sidebarHoverBgL', '220 10% 92%'),
  ('sidebarHoverTextL', '220 25% 25%'),
  ('sidebarBorderL', '220 15% 85%'),
  -- Sidebar Dark Theme Defaults
  ('sidebarBgStartD', '220 15% 12%'),
  ('sidebarBgEndD', '220 15% 9%'),
  ('sidebarTextD', '210 30% 85%'),
  ('sidebarActiveBgStartD', '206 97% 73%'), -- Corresponds to primary-gradient-start-d
  ('sidebarActiveBgEndD', '244 95% 83%'),   -- Corresponds to primary-gradient-end-d
  ('sidebarActiveTextD', '0 0% 100%'),      -- Corresponds to primary-foreground (dark)
  ('sidebarHoverBgD', '220 15% 20%'),
  ('sidebarHoverTextD', '210 30% 90%'),
  ('sidebarBorderD', '220 15% 18%')
ON CONFLICT (key) DO NOTHING;


-- User Table (NextAuth compatible for Credentials Provider)
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP WITH TIME ZONE, -- For NextAuth
  password TEXT, -- Hashed password
  role TEXT NOT NULL DEFAULT 'Recruiter', -- e.g., Admin, Recruiter, Hiring Manager
  "avatarUrl" TEXT, -- URL to user's avatar image
  "dataAiHint" TEXT, -- For AI image generation hints
  "modulePermissions" TEXT[] DEFAULT '{}', -- Array of PlatformModuleId strings
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Groups (effectively Roles)
CREATE TABLE IF NOT EXISTS "UserGroup" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_system_role BOOLEAN DEFAULT FALSE, -- To protect default Admin/Recruiter/Manager roles
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for Users and UserGroups (Many-to-Many)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
  "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  "groupId" UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
  PRIMARY KEY ("userId", "groupId")
);

-- Platform Module Table (Predefined, but stored for potential future dynamic management)
-- For this prototype, permissions are hardcoded in types.ts but this table links them to UserGroups.
CREATE TABLE IF NOT EXISTS "PlatformModule" (
  id TEXT PRIMARY KEY, -- e.g., 'CANDIDATES_MANAGE'
  label TEXT NOT NULL,
  category TEXT,
  description TEXT
);

-- Junction table for UserGroups and PlatformModules (Permissions for Groups)
CREATE TABLE IF NOT EXISTS "UserGroup_PlatformModule" (
  group_id UUID REFERENCES "UserGroup"(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES "PlatformModule"(id) ON DELETE CASCADE, -- Refers to PlatformModule.id
  PRIMARY KEY (group_id, permission_id)
);

-- Seed PlatformModules (if not already done)
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


-- Default Admin User (Ensure bcrypt hash is generated for 'nccadmin')
-- Generate with: node -e "console.log(require('bcrypt').hashSync('nccadmin', 10))"
-- Example hash for 'nccadmin': $2b$10$EXAMPLEHASHFORnccadminPLEASECHANGE
INSERT INTO "User" (name, email, password, role, "modulePermissions") VALUES
  ('Default Admin', 'admin@ncc.com', '$2b$10$0QI08zau0xK4sU/ii.X2V.J8aJnxrW3ZDbQn8A2q0i9L5/Yl/19o6', 'Admin', '{}') -- Example, use a real hash
ON CONFLICT (email) DO NOTHING;

-- Create default UserGroups (Roles) and assign permissions
DO $$
DECLARE
  admin_group_id UUID;
  recruiter_group_id UUID;
  manager_group_id UUID;
BEGIN
  -- Admin Role
  INSERT INTO "UserGroup" (name, description, is_system_role, is_default) VALUES
    ('Administrator', 'Full system access.', TRUE, FALSE)
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO admin_group_id;
  IF admin_group_id IS NULL THEN SELECT id INTO admin_group_id FROM "UserGroup" WHERE name = 'Administrator'; END IF;

  -- Recruiter Role
  INSERT INTO "UserGroup" (name, description, is_system_role, is_default) VALUES
    ('Recruiter', 'Manages candidates and positions.', TRUE, TRUE) -- Default role for new users
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO recruiter_group_id;
  IF recruiter_group_id IS NULL THEN SELECT id INTO recruiter_group_id FROM "UserGroup" WHERE name = 'Recruiter'; END IF;
  
  -- Hiring Manager Role
  INSERT INTO "UserGroup" (name, description, is_system_role, is_default) VALUES
    ('Hiring Manager', 'Reviews candidates and provides feedback.', TRUE, FALSE)
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO manager_group_id;
  IF manager_group_id IS NULL THEN SELECT id INTO manager_group_id FROM "UserGroup" WHERE name = 'Hiring Manager'; END IF;

  -- Assign ALL permissions to Admin Group
  INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id)
  SELECT admin_group_id, pm.id FROM "PlatformModule" pm
  ON CONFLICT DO NOTHING;

  -- Assign specific permissions to Recruiter Group
  INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
    (recruiter_group_id, 'CANDIDATES_VIEW'),
    (recruiter_group_id, 'CANDIDATES_MANAGE'),
    (recruiter_group_id, 'CANDIDATES_IMPORT'), -- Can be removed if too permissive
    (recruiter_group_id, 'CANDIDATES_EXPORT'), -- Can be removed
    (recruiter_group_id, 'POSITIONS_VIEW'),
    (recruiter_group_id, 'POSITIONS_MANAGE'),
    (recruiter_group_id, 'USER_PREFERENCES_MANAGE') -- Recruiters can manage their own UI prefs
  ON CONFLICT DO NOTHING;

  -- Assign specific permissions to Hiring Manager Group
  INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES
    (manager_group_id, 'CANDIDATES_VIEW'), -- Typically view only, or specific candidates
    (manager_group_id, 'POSITIONS_VIEW'),
    (manager_group_id, 'USER_PREFERENCES_MANAGE')
  ON CONFLICT DO NOTHING;
  
  -- Assign the default admin user to the Administrator group
  DECLARE admin_user_id UUID;
  BEGIN
    SELECT id INTO admin_user_id FROM "User" WHERE email = 'admin@ncc.com';
    IF admin_user_id IS NOT NULL AND admin_group_id IS NOT NULL THEN
      INSERT INTO "User_UserGroup" ("userId", "groupId") VALUES (admin_user_id, admin_group_id)
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
     RAISE NOTICE 'Could not assign admin@ncc.com to Administrator group. User or group might not exist yet if created in this same script run prior to this block without RETURNING id for groups.';
  END;

END $$;


-- Positions Table
CREATE TABLE IF NOT EXISTS "Position" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  "isOpen" BOOLEAN DEFAULT TRUE,
  position_level TEXT, -- e.g., Senior, Mid-Level
  custom_attributes JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment Stages Table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- True for predefined, uneditable stages
  sort_order INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default recruitment stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
  ('Applied', 'Initial application received.', TRUE, 0),
  ('Screening', 'Resume and initial screening.', TRUE, 10),
  ('Shortlisted', 'Candidate shortlisted for interviews.', TRUE, 20),
  ('Interview Scheduled', 'Interview has been scheduled.', TRUE, 30),
  ('Interviewing', 'Candidate is in the interview process.', TRUE, 40),
  ('Offer Extended', 'Job offer has been extended.', TRUE, 50),
  ('Offer Accepted', 'Candidate accepted the job offer.', TRUE, 60),
  ('Hired', 'Candidate has been hired.', TRUE, 70),
  ('Rejected', 'Candidate has been rejected.', TRUE, 80),
  ('On Hold', 'Candidate application is on hold.', TRUE, 90)
ON CONFLICT (name) DO NOTHING;


-- Candidates Table
CREATE TABLE IF NOT EXISTS "Candidate" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  "avatarUrl" TEXT,
  "dataAiHint" TEXT,
  "resumePath" TEXT, -- Path/key in MinIO
  "parsedData" JSONB, -- For structured resume data
  "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
  "fitScore" INTEGER DEFAULT 0,
  status TEXT REFERENCES "RecruitmentStage"(name) ON DELETE RESTRICT DEFAULT 'Applied', -- Candidate's current stage
  "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  custom_attributes JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume History Table
CREATE TABLE IF NOT EXISTS "ResumeHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
  "filePath" TEXT NOT NULL, -- Path/key in MinIO for this version
  "originalFileName" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL
);

-- Transition Records Table
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stage TEXT NOT NULL REFERENCES "RecruitmentStage"(name) ON DELETE RESTRICT,
  notes TEXT,
  "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Audit Log Table
CREATE TABLE IF NOT EXISTS "LogEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL, -- e.g., INFO, WARN, ERROR, AUDIT
  message TEXT NOT NULL,
  source TEXT, -- e.g., API:Candidates, Auth
  "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  details JSONB, -- For additional structured log data
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry" (timestamp);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry" (level);
CREATE INDEX IF NOT EXISTS idx_logentry_actingUserId ON "LogEntry" ("actingUserId");


-- User UI Preferences Table
CREATE TABLE IF NOT EXISTS "UserUIDisplayPreference" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL, -- 'Candidate' or 'Position'
  attribute_key TEXT NOT NULL, -- e.g., 'name', 'parsedData.personal_info.location'
  ui_preference TEXT NOT NULL, -- 'Standard', 'Emphasized', 'Hidden'
  custom_note TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", model_type, attribute_key)
);


-- Webhook Field Mapping Table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_path TEXT UNIQUE NOT NULL, -- CandiTrack attribute path (e.g., 'candidate_info.personal_info.firstname')
  source_path TEXT,                 -- JSON path from incoming webhook (e.g., 'data.profile.firstName')
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom Field Definitions Table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL, -- 'Candidate' or 'Position'
  field_key TEXT NOT NULL,  -- e.g., 'linkedin_url', 'salary_expectation'
  label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple'
  options JSONB,            -- For select types, array of { value: string, label: string }
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (model_name, field_key)
);

-- Notification System Tables
CREATE TABLE IF NOT EXISTS "NotificationEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL, -- e.g., 'candidate.created', 'status.updated'
  label TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationChannel" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key TEXT UNIQUE NOT NULL, -- 'email', 'webhook'
  label TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NotificationSetting" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  configuration JSONB, -- For channel-specific settings like webhook URL
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, channel_id)
);

-- Seed Notification Events and Channels
INSERT INTO "NotificationEvent" (event_key, label, description) VALUES
  ('candidate.created', 'Candidate Created', 'Triggered when a new candidate profile is created.'),
  ('candidate.status_updated', 'Candidate Status Updated', 'Triggered when a candidate''s recruitment stage changes.'),
  ('candidate.assigned', 'Candidate Assigned', 'Triggered when a candidate is assigned to a recruiter.'),
  ('position.created', 'Position Created', 'Triggered when a new job position is created.'),
  ('position.status_changed', 'Position Status Changed', 'Triggered when a job position is opened or closed.')
ON CONFLICT (event_key) DO NOTHING;

INSERT INTO "NotificationChannel" (channel_key, label) VALUES
  ('email', 'Email Notification'),
  ('webhook', 'Webhook Notification')
ON CONFLICT (channel_key) DO NOTHING;


-- Dummy Data (Optional - for testing)
-- Example: Associate admin user with Administrator group
-- This assumes the admin user and Administrator group have been created above.
-- You might need to query their IDs if they aren't fixed UUIDs.

-- Function to create a trigger for updating "updatedAt" columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with "updatedAt"
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usergroup_updated_at BEFORE UPDATE ON "UserGroup" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_position_updated_at BEFORE UPDATE ON "Position" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_updated_at BEFORE UPDATE ON "Candidate" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transitionrecord_updated_at BEFORE UPDATE ON "TransitionRecord" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recruitmentstage_updated_at BEFORE UPDATE ON "RecruitmentStage" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_systemsetting_updated_at BEFORE UPDATE ON "SystemSetting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_useruipreference_updated_at BEFORE UPDATE ON "UserUIDisplayPreference" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhookfieldmapping_updated_at BEFORE UPDATE ON "WebhookFieldMapping" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customfielddefinition_updated_at BEFORE UPDATE ON "CustomFieldDefinition" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notificationsetting_updated_at BEFORE UPDATE ON "NotificationSetting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

    