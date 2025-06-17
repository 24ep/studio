
-- Ensure a user exists before "User" table creation (if foreign keys depend on it immediately)
-- Though typically, User table would be among the first.

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(2048),
    "dataAiHint" VARCHAR(100),
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Position Table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN DEFAULT true,
    position_level VARCHAR(100), -- e.g., Senior, Mid-Level, Entry
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "resumePath" VARCHAR(1024), -- Path in MinIO
    "parsedData" JSONB, -- For storing structured resume data, job matches, etc.
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0, -- Percentage, 0-100
    status VARCHAR(100) NOT NULL DEFAULT 'Applied', -- Default status, will reference RecruitmentStage later
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- Assigned recruiter
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"(status);
CREATE INDEX IF NOT EXISTS idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidate_recruiter_id ON "Candidate"("recruiterId");


-- TransitionRecord Table (Tracks candidate status changes)
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(100) NOT NULL, -- Stage name
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who made the change
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transition_candidate_id ON "TransitionRecord"("candidateId");

-- LogEntry Table (For application-level logging)
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    message TEXT NOT NULL,
    source VARCHAR(255),
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    details JSONB, -- For structured log details
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Keep for record creation time
);
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_logentry_source ON "LogEntry"(source);

-- RecruitmentStage Table
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- True for predefined, non-deletable stages
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recruitmentstage_sort_order ON "RecruitmentStage"(sort_order);

-- WebhookFieldMapping Table (New for server-side webhook mapping config)
CREATE TABLE IF NOT EXISTS "WebhookFieldMapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_path TEXT NOT NULL UNIQUE, -- The path in CandiTrack's expected structure
    source_path TEXT,                 -- The path in the incoming webhook JSON (can be empty if not mapped)
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhookfieldmapping_target_path ON "WebhookFieldMapping"(target_path);


-- Seed Data

-- Insert default admin user (ensure bcrypt hash is for 'nccadmin')
-- The hash for 'nccadmin' with salt 10 is: $2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly
-- IMPORTANT: Replace 'YOUR_BCRYPT_HASH_OF_nccadmin_HERE' with the actual hash if you change the default password.
-- The provided hash is for 'nccadmin'.
INSERT INTO "User" (name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions")
VALUES (
    'Admin NCC',
    'admin@ncc.com',
    '$2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly', -- Hash for 'nccadmin'
    'Admin',
    'https://placehold.co/100x100.png?text=A',
    'profile person',
    ARRAY[
        'CANDIDATES_VIEW', 'CANDIDATES_MANAGE',
        'POSITIONS_VIEW', 'POSITIONS_MANAGE',
        'USERS_MANAGE', 'SETTINGS_ACCESS',
        'RECRUITMENT_STAGES_MANAGE', 'DATA_MODELS_MANAGE',
        'WEBHOOK_MAPPING_MANAGE', 'LOGS_VIEW'
    ]::TEXT[]
) ON CONFLICT (email) DO NOTHING;

-- Seed default recruitment stages
INSERT INTO "RecruitmentStage" (name, description, is_system, sort_order)
VALUES
    ('Applied', 'Candidate has applied for a position.', TRUE, 10),
    ('Screening', 'Resume screening and initial review.', TRUE, 20),
    ('Shortlisted', 'Candidate has been shortlisted for further consideration.', TRUE, 30),
    ('Interview Scheduled', 'An interview has been scheduled with the candidate.', TRUE, 40),
    ('Interviewing', 'Candidate is currently in the interview process.', TRUE, 50),
    ('Offer Extended', 'A job offer has been extended to the candidate.', TRUE, 60),
    ('Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 70),
    ('Hired', 'Candidate has been hired.', TRUE, 80),
    ('Rejected', 'Candidate has been rejected.', TRUE, 90),
    ('On Hold', 'Candidate application is currently on hold.', TRUE, 100)
ON CONFLICT (name) DO NOTHING;


-- Note: You may want to add more initial data or indexes as needed.
-- Example for a "Recruiter" user:
-- INSERT INTO "User" (name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions")
-- VALUES (
--     'Jane Recruiter',
--     'jane@ncc.com',
--     '$2b$10$SOME_OTHER_HASH_FOR_PASSWORD', -- Replace with actual hash
--     'Recruiter',
--     'https://placehold.co/100x100.png?text=J',
--     'profile person',
--     ARRAY['CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'POSITIONS_VIEW']::TEXT[]
-- ) ON CONFLICT (email) DO NOTHING;

SELECT 'Database initialization script completed.';
