
-- Ensure the uuid-ossp extension is available for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the Position table
CREATE TABLE "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the Candidate table
CREATE TABLE "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL, -- Or ON DELETE RESTRICT if you want to prevent deleting positions with candidates
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Applied',
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB, -- For storing structured resume data
    "resumePath" VARCHAR(1024), -- Path/key for the resume file in MinIO
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the TransitionRecord table for candidate status history
CREATE TABLE "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(50) NOT NULL, -- Corresponds to CandidateStatus type
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the LogEntry table
CREATE TABLE "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL, -- e.g., INFO, WARN, ERROR, DEBUG
    message TEXT NOT NULL,
    source VARCHAR(255), -- Optional: e.g., API, Frontend, System
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- For consistency
);

-- Add indexes for frequently queried columns to improve performance
CREATE INDEX idx_candidate_email ON "Candidate"(email);
CREATE INDEX idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX idx_candidate_status ON "Candidate"(status);
CREATE INDEX idx_transition_candidate_id ON "TransitionRecord"("candidateId");
CREATE INDEX idx_logentry_timestamp ON "LogEntry"(timestamp DESC);
CREATE INDEX idx_logentry_level ON "LogEntry"(level);

-- You can add more tables or modify these as your application evolves.
-- For example, a User table if you implement database-backed user accounts.
-- CREATE TABLE "User" (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255),
--     email VARCHAR(255) UNIQUE NOT NULL,
--     "hashedPassword" VARCHAR(255), -- If using credentials provider with DB
--     role VARCHAR(50) NOT NULL DEFAULT 'Recruiter', -- e.g., Admin, Recruiter, Hiring Manager
--     "azureAdObjectId" VARCHAR(255) UNIQUE, -- If linking Azure AD users
--     "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_user_email ON "User"(email);

-- Grant privileges to the devuser (or your application user)
-- Note: Docker setup usually handles user creation and basic grants.
-- If more specific grants are needed, add them here.
-- Example:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO devuser;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO devuser;
-- (Adjust 'devuser' if your POSTGRES_USER is different)

-- Print a success message to the console
\echo 'Database schema created successfully (if no errors above).'
