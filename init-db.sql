-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Position Table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    position_level VARCHAR(100), -- Added position_level
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_position_is_open ON "Position"("isOpen");

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stores hashed password
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of PlatformModuleId
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0 CHECK ("fitScore" >= 0 AND "fitScore" <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'Applied',
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB,
    "resumePath" VARCHAR(1024),
    "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- New field for assigned recruiter
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_email ON "Candidate"(email);
CREATE INDEX IF NOT EXISTS idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"(status);
CREATE INDEX IF NOT EXISTS idx_candidate_recruiter_id ON "Candidate"("recruiterId"); -- Index for recruiterId

-- TransitionRecord Table
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(50) NOT NULL,
    notes TEXT,
    "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transition_candidate_id ON "TransitionRecord"("candidateId");

-- LogEntry Table
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
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_logentry_acting_user_id ON "LogEntry"("actingUserId");


-- Example of inserting a default admin user with a pre-hashed password for 'nccadmin'
-- Replace 'YOUR_BCRYPT_HASH_OF_nccadmin_HERE' with the actual hash.
-- To generate a hash, you can use a simple Node.js script:
-- const bcrypt = require('bcrypt');
-- const saltRounds = 10;
-- const plaintextPassword = 'nccadmin';
-- bcrypt.hash(plaintextPassword, saltRounds, function(err, hash) {
--   if (err) { console.error(err); return; }
--   console.log(`Bcrypt hash for '${plaintextPassword}': ${hash}`);
-- });
-- Ensure this user is created only if it doesn't exist to avoid errors on re-runs if schema allows.
INSERT INTO "User" (name, email, password, role)
SELECT 'Admin NCC', 'admin@ncc.com', '$2b$10$abcdefghijklmnopqrstuv', 'Admin' -- REPLACE HASH!
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@ncc.com');

-- Add other initial data if needed, e.g., default positions
INSERT INTO "Position" (title, department, description, "isOpen", position_level)
SELECT 'Software Engineer', 'Engineering', 'Develop amazing software.', TRUE, 'Mid-Level'
WHERE NOT EXISTS (SELECT 1 FROM "Position" WHERE title = 'Software Engineer' AND department = 'Engineering');

INSERT INTO "Position" (title, department, description, "isOpen", position_level)
SELECT 'Product Manager', 'Product', 'Manage product vision and roadmap.', TRUE, 'Senior'
WHERE NOT EXISTS (SELECT 1 FROM "Position" WHERE title = 'Product Manager' AND department = 'Product');
