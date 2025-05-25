
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set client encoding
SET client_encoding = 'UTF8';

-- Create Schema if it doesn't exist (though public usually exists)
CREATE SCHEMA IF NOT EXISTS public;

-- Table for User Profiles
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In production, this MUST store hashed passwords
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Table for Job Positions
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_position_title ON "Position"(title);
CREATE INDEX IF NOT EXISTS idx_position_department ON "Position"(department);

-- Table for Candidates
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0 CHECK ("fitScore" >= 0 AND "fitScore" <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold')),
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB,
    "resumePath" VARCHAR(1024), -- Stores path/key for MinIO object
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_email ON "Candidate"(email);
CREATE INDEX IF NOT EXISTS idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"(status);

-- Table for Candidate Transition History
CREATE TABLE IF NOT EXISTS "TransitionRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold')),
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transition_record_candidate_id ON "TransitionRecord"("candidateId");

-- Table for Application Log Entries
CREATE TABLE IF NOT EXISTS "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    message TEXT NOT NULL,
    source VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For log entry creation time, timestamp is for log event time
);
CREATE INDEX IF NOT EXISTS idx_log_entry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX IF NOT EXISTS idx_log_entry_level ON "LogEntry"(level);


-- Optional: Insert a default admin user (replace with a securely hashed password in production)
-- Note: Password hashing must be implemented in your application logic.
-- This is an example for initial setup.
-- INSERT INTO "User" (name, email, password, role, "avatarUrl", "dataAiHint")
-- VALUES ('Default Admin', 'admin@ncc.com', 'password', 'Admin', 'https://placehold.co/100x100.png?text=A', 'profile person')
-- ON CONFLICT (email) DO NOTHING;

-- You might want to add more indexes based on your query patterns.
