
-- Ensure the gen_random_uuid() function is available if using PostgreSQL 13+
-- For older versions, you might need to install the pgcrypto extension: CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- And use gen_random_uuid() or uuid_generate_v4() from pgcrypto.

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- BCrypt hashed password
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" TEXT,
    "dataAiHint" TEXT, -- For placeholder avatar generation
    "modulePermissions" TEXT[] DEFAULT '{}', -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- UserGroup Table
CREATE TABLE IF NOT EXISTS "UserGroup" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User_UserGroup Join Table (for many-to-many relationship between User and UserGroup)
CREATE TABLE IF NOT EXISTS "User_UserGroup" (
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "groupId" UUID NOT NULL REFERENCES "UserGroup"(id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "groupId")
);

-- Position Table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT true,
    position_level TEXT, -- e.g., 'Senior', 'Mid-Level', 'Entry'
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    "resumePath" TEXT, -- Path to resume file in MinIO
    "parsedData" JSONB, -- Parsed resume data as JSON
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status TEXT NOT NULL, -- Current status/stage of the candidate
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TransitionRecord Table (tracks candidate status changes)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stage TEXT NOT NULL, -- Stage name
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who made the change
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LogEntry Table (for application audit and error logging)
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source TEXT, -- e.g., 'API:Auth', 'Service:N8NProcessor'
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB, -- Additional structured log data
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For internal record tracking
);

-- RecruitmentStage Table (defines available stages in the pipeline)
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for core stages that cannot be deleted
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WebhookFieldMapping Table
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_path TEXT NOT NULL UNIQUE, -- e.g., "candidate_info.personal_info.firstname"
    source_path TEXT,                 -- e.g., "data.profile.firstName" from n8n JSON
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CustomFieldDefinition Table
CREATE TABLE IF NOT EXISTS "CustomFieldDefinition" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL CHECK (model_name IN ('Candidate', 'Position')),
    field_key TEXT NOT NULL, -- Programmatic key for the field
    label TEXT NOT NULL,     -- User-friendly display name
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple')),
    options JSONB,           -- For select types, array of {value: string, label: string}
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_name, field_key)
);

-- Seed Data --

-- Default Admin User (Password: nccadmin)
-- Generate bcrypt hash for 'nccadmin'. Example hash (salt rounds 10): $2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly
-- IMPORTANT: Replace the hash if you change the default password!
INSERT INTO "User" (name, email, password, role, "modulePermissions")
VALUES ('Admin NCC', 'admin@ncc.com', '$2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly', 'Admin', ARRAY['USERS_MANAGE', 'SETTINGS_ACCESS', 'RECRUITMENT_STAGES_MANAGE', 'DATA_MODELS_MANAGE', 'CUSTOM_FIELDS_MANAGE', 'WEBHOOK_MAPPING_MANAGE', 'USER_GROUPS_MANAGE', 'LOGS_VIEW'])
ON CONFLICT (email) DO NOTHING;

-- System Recruitment Stages (example)
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order) VALUES
('Applied', 'Candidate has applied for the position.', TRUE, 0),
('Screening', 'Resume and initial screening.', TRUE, 10),
('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 20),
('Interview Scheduled', 'Interview has been scheduled with the candidate.', TRUE, 30),
('Interviewing', 'Candidate is currently in the interviewing process.', TRUE, 40),
('Offer Extended', 'An offer has been extended to the candidate.', TRUE, 50),
('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 60),
('Hired', 'Candidate has been hired.', TRUE, 70),
('Rejected', 'Candidate has been rejected.', TRUE, 80),
('On Hold', 'Candidate application is temporarily on hold.', TRUE, 90)
ON CONFLICT (name) DO NOTHING;

-- Example Position (optional, for testing)
INSERT INTO "Position" (title, department, description, "isOpen", position_level)
VALUES ('Senior Software Engineer', 'Technology', 'Seeking an experienced software engineer to build amazing things.', TRUE, 'Senior')
ON CONFLICT DO NOTHING; -- Or a more specific conflict target if title should be unique

-- Example User Group (optional, for testing)
INSERT INTO "UserGroup" (name, description)
VALUES ('Tech Recruiters', 'Recruiters specializing in technology roles')
ON CONFLICT (name) DO NOTHING;
INSERT INTO "UserGroup" (name, description)
VALUES ('Sales Hiring Team', 'Team responsible for hiring sales personnel')
ON CONFLICT (name) DO NOTHING;

SELECT 'Database initialization script completed.' AS status;
