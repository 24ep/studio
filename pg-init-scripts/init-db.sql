-- Use uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom enum types for consistency and validation
CREATE TYPE "UserRole" AS ENUM ('Admin', 'Recruiter', 'Hiring Manager');
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT');
CREATE TYPE "CustomFieldModel" AS ENUM ('Candidate', 'Position');
CREATE TYPE "CustomFieldType" AS ENUM ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple');
CREATE TYPE "NotificationChannelKey" AS ENUM ('email', 'webhook');

-- UserGroup table (for Roles)
CREATE TABLE "UserGroup" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_system_role BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User table
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "modulePermissions" TEXT[], -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User <-> UserGroup many-to-many join table
CREATE TABLE "User_UserGroup" (
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- PlatformModule table (virtual, permissions are hardcoded in types.ts)
-- UserGroup <-> PlatformModule many-to-many join table for permissions
CREATE TABLE "UserGroup_PlatformModule" (
    group_id UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL, -- Corresponds to PlatformModuleId
    PRIMARY KEY (group_id, permission_id)
);


-- Position table
CREATE TABLE "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT TRUE,
    position_level VARCHAR(100),
    custom_attributes JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate table
CREATE TABLE "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "resumePath" TEXT,
    "parsedData" JSONB,
    custom_attributes JSONB,
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(100) NOT NULL,
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ResumeHistory table
CREATE TABLE "ResumeHistory" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    "filePath" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL
);


-- RecruitmentStage table
CREATE TABLE "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TransitionRecord table
CREATE TABLE "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(100) NOT NULL,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- LogEntry table
CREATE TABLE "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level "LogLevel" NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CustomFieldDefinition table
CREATE TABLE "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name "CustomFieldModel" NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type "CustomFieldType" NOT NULL,
    options JSONB, -- For select types
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_name, field_key)
);

-- SystemSetting table
CREATE TABLE "SystemSetting" (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- UserUIDisplayPreference table
CREATE TABLE "UserUIDisplayPreference" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    model_type "CustomFieldModel" NOT NULL,
    attribute_key VARCHAR(255) NOT NULL,
    ui_preference VARCHAR(50) NOT NULL,
    custom_note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", model_type, attribute_key)
);


-- NotificationEvent table
CREATE TABLE "NotificationEvent" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_key VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NotificationChannel table
CREATE TABLE "NotificationChannel" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_key "NotificationChannelKey" UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NotificationSetting table
CREATE TABLE "NotificationSetting" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES "NotificationEvent"(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES "NotificationChannel"(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB, -- For webhook URL, etc.
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, channel_id)
);


-- WebhookFieldMapping table
CREATE TABLE "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_path VARCHAR(255) UNIQUE NOT NULL,
    source_path TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --- SEED DATA ---

-- Seed System User Roles (as Groups)
INSERT INTO "UserGroup" (id, name, description, is_system_role, is_default) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin', 'Administrators have full access to all system features.', TRUE, FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Recruiter', 'Recruiters manage candidates and positions.', TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Hiring Manager', 'Hiring Managers review assigned candidates.', TRUE, FALSE);

-- Seed Default Admin User
-- The password is 'nccadmin'. This hash was generated using bcrypt with cost 10.
INSERT INTO "User" (id, name, email, password, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'NCC Admin', 'admin@ncc.com', '$2a$10$Ifg1vJk3Ncvk2zG8aV.AzuX/JgaqF.u6uI8d9vG4bB4c2X9a7G5Ea', 'Admin');

-- Assign Admin user to Admin group
INSERT INTO "User_UserGroup" ("userId", "groupId") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Seed System Default Recruitment Stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Candidate has applied for a position.', TRUE, 10),
('Screening', 'Initial screening of the candidate''s resume and profile.', TRUE, 20),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 30),
('Interview Scheduled', 'An interview has been scheduled with the candidate.', TRUE, 40),
('Interviewing', 'Candidate is currently in the interview process.', TRUE, 50),
('Offer Extended', 'A job offer has been extended to the candidate.', TRUE, 60),
('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 70),
('Hired', 'Candidate has been hired.', TRUE, 80),
('Rejected', 'Candidate has been rejected.', TRUE, 90),
('On Hold', 'Candidate application is currently on hold.', TRUE, 100);

-- Seed Notification Events and Channels
INSERT INTO "NotificationEvent" (event_key, label, description) VALUES
('candidate_created', 'Candidate Created', 'Triggered when a new candidate profile is created.'),
('status_updated', 'Candidate Status Updated', 'Triggered when a candidate''s status is changed.'),
('note_added', 'Note Added to Candidate', 'Triggered when a new note is added to a candidate''s transition history.'),
('recruiter_assigned', 'Recruiter Assigned', 'Triggered when a candidate is assigned to a recruiter.');

INSERT INTO "NotificationChannel" (channel_key, label) VALUES
('email', 'Email'),
('webhook', 'Webhook');

-- Seed initial System Settings with defaults
INSERT INTO "SystemSetting" (key, value) VALUES
('appName', 'CandiTrack'),
('appThemePreference', 'system'),
('primaryGradientStart', '179 67% 66%'),
('primaryGradientEnd', '238 74% 61%'),
('loginPageBackgroundType', 'default'),
('loginPageBackgroundColor1', '#F0F4F7'),
('loginPageBackgroundColor2', '#3F51B5'),
('sidebarBgStartL', '220 25% 97%'),
('sidebarBgEndL', '220 20% 94%'),
('sidebarTextL', '220 25% 30%'),
('sidebarActiveBgStartL', '179 67% 66%'),
('sidebarActiveBgEndL', '238 74% 61%'),
('sidebarActiveTextL', '0 0% 100%'),
('sidebarHoverBgL', '220 10% 92%'),
('sidebarHoverTextL', '220 25% 25%'),
('sidebarBorderL', '220 15% 85%'),
('sidebarBgStartD', '220 15% 12%'),
('sidebarBgEndD', '220 15% 9%'),
('sidebarTextD', '210 30% 85%'),
('sidebarActiveBgStartD', '179 67% 66%'),
('sidebarActiveBgEndD', '238 74% 61%'),
('sidebarActiveTextD', '0 0% 100%'),
('sidebarHoverBgD', '220 15% 20%'),
('sidebarHoverTextD', '210 30% 90%'),
('sidebarBorderD', '220 15% 18%')
ON CONFLICT (key) DO NOTHING;
