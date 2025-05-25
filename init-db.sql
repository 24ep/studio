-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define ENUM types for roles and log levels if not already existing or handled by application logic
-- For simplicity, we'll use VARCHAR and application-level validation for roles/levels in this script.

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stores hashed passwords
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "modulePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Stores an array of module permission IDs
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

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

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL, -- Note: Consider if email should be unique per system or per position
    phone VARCHAR(50),
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0 CHECK ("fitScore" >= 0 AND "fitScore" <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'Applied',
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB,
    "resumePath" VARCHAR(1024),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_email ON "Candidate"(email);
CREATE INDEX IF NOT EXISTS idx_candidate_position_id ON "Candidate"("positionId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_email_unique ON "Candidate"(email); -- Added unique constraint on candidate email

-- TransitionRecord Table
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(50) NOT NULL,
    notes TEXT,
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

-- Example of how you might pre-hash a password for an initial admin user.
-- You'd generate this hash outside of this script (e.g., using a Node.js script with bcrypt).
-- Default password "password" for admin@canditrack.com, hashed with bcrypt (cost factor 10)
-- Example hash for 'password': $2b$10$.....................................................
-- Replace 'YOUR_PRE_HASHED_ADMIN_PASSWORD' with an actual bcrypt hash.
-- COMMENTING OUT TO PREVENT ERRORS IF RUN MULTIPLE TIMES WITHOUT UNIQUE CONSTRAINT HANDLING FOR EMAIL
-- INSERT INTO "User" (name, email, password, role, "modulePermissions")
-- VALUES ('Admin User', 'admin@canditrack.com', 'YOUR_PRE_HASHED_ADMIN_PASSWORD', 'Admin', ARRAY['CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'USERS_MANAGE', 'SETTINGS_ACCESS', 'LOGS_VIEW']::TEXT[])
-- ON CONFLICT (email) DO NOTHING;

-- List of defined platform modules (for reference when setting "modulePermissions"):
-- CANDIDATES_VIEW
-- CANDIDATES_MANAGE
-- POSITIONS_VIEW
-- POSITIONS_MANAGE
-- USERS_MANAGE
-- SETTINGS_ACCESS
-- LOGS_VIEW
