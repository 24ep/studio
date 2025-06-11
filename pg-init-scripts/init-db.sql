-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables (optional, for clean dev environments if script is run manually)
-- In a Docker init scenario, these usually run on an empty DB.
DROP TABLE IF EXISTS "LogEntry" CASCADE;
DROP TABLE IF EXISTS "TransitionRecord" CASCADE;
DROP TABLE IF EXISTS "Candidate" CASCADE;
DROP TABLE IF EXISTS "RecruitmentStage" CASCADE;
DROP TABLE IF EXISTS "Position" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;


-- User Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL, -- For credentials-based login
    "role" VARCHAR(50) NOT NULL CHECK ("role" IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" TEXT,
    "dataAiHint" VARCHAR(100),
    "modulePermissions" TEXT[], -- Array of PlatformModuleId strings
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_role" ON "User"("role");

-- Position Table
CREATE TABLE "Position" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "department" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    "position_level" VARCHAR(100),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX "idx_position_isOpen" ON "Position"("isOpen");

-- RecruitmentStage Table
CREATE TABLE "RecruitmentStage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE for core stages
    "sort_order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX "idx_recruitmentstage_name" ON "RecruitmentStage"("name");
CREATE INDEX "idx_recruitmentstage_sort_order" ON "RecruitmentStage"("sort_order");

-- Candidate Table
CREATE TABLE "Candidate" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "phone" VARCHAR(50),
    "resumePath" TEXT,
    "parsedData" JSONB,
    "positionId" UUID,
    "fitScore" INTEGER DEFAULT 0,
    "status" VARCHAR(100) NOT NULL, -- References RecruitmentStage.name
    "applicationDate" TIMESTAMPTZ DEFAULT NOW(),
    "recruiterId" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "fk_candidate_position" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_candidate_recruiter" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_candidate_email" ON "Candidate"("email");
CREATE INDEX "idx_candidate_status" ON "Candidate"("status");
CREATE INDEX "idx_candidate_positionId" ON "Candidate"("positionId");
CREATE INDEX "idx_candidate_recruiterId" ON "Candidate"("recruiterId");

-- TransitionRecord Table
CREATE TABLE "TransitionRecord" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "stage" VARCHAR(100) NOT NULL, -- References RecruitmentStage.name
    "notes" TEXT,
    "actingUserId" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "fk_transition_candidate" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_transition_user" FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_transitionrecord_candidateId" ON "TransitionRecord"("candidateId");

-- LogEntry Table
CREATE TABLE "LogEntry" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "level" VARCHAR(10) NOT NULL CHECK ("level" IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
    "message" TEXT NOT NULL,
    "source" VARCHAR(100),
    "actingUserId" UUID,
    "details" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "fk_log_user" FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_logentry_timestamp" ON "LogEntry"("timestamp" DESC);
CREATE INDEX "idx_logentry_level" ON "LogEntry"("level");
CREATE INDEX "idx_logentry_source" ON "LogEntry"("source");


-- Seed Data --

-- Default Admin User
INSERT INTO "User" ("id", "name", "email", "password", "role", "avatarUrl", "dataAiHint", "modulePermissions")
VALUES (
    'f0000000-0000-0000-0000-000000000001', -- Fixed UUID for easier reference if needed
    'NCC Admin',
    'admin@ncc.com',
    '$2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly', -- Hashed 'nccadmin'
    'Admin',
    'https://placehold.co/100x100.png?text=A',
    'profile admin',
    ARRAY['CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'USERS_MANAGE', 'SETTINGS_ACCESS', 'RECRUITMENT_STAGES_MANAGE', 'LOGS_VIEW']
);

-- Default Recruitment Stages
INSERT INTO "RecruitmentStage" ("name", "description", "is_system", "sort_order") VALUES
('Applied', 'Candidate has submitted an application.', TRUE, 10),
('Screening', 'Application is being screened by HR or recruiter.', TRUE, 20),
('Shortlisted', 'Candidate has been shortlisted for consideration.', TRUE, 30),
('Interview Scheduled', 'An interview has been scheduled with the candidate.', TRUE, 40),
('Interviewing', 'Candidate is currently in the interview process.', TRUE, 50),
('Offer Extended', 'An employment offer has been extended to the candidate.', TRUE, 60),
('Offer Accepted', 'Candidate has accepted the employment offer.', TRUE, 70),
('Hired', 'Candidate has been hired and onboarded.', TRUE, 80),
('Rejected', 'Candidate is no longer being considered for the position.', TRUE, 90),
('On Hold', 'Candidate application is temporarily on hold.', TRUE, 100);

