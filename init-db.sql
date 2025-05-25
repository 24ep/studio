
-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Position Table
CREATE TABLE IF NOT EXISTS "Position" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Table
CREATE TABLE IF NOT EXISTS "Candidate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL,
    "fitScore" INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Applied',
    "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB,
    "resumePath" VARCHAR(1024),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- LogEntry Table
CREATE TABLE IF NOT EXISTS "LogEntry" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- IMPORTANT: Store hashed passwords in production!
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
    "avatarUrl" VARCHAR(1024),
    "dataAiHint" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_candidate_email ON "Candidate"(email);
CREATE INDEX IF NOT EXISTS idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX IF NOT EXISTS idx_transition_candidate_id ON "TransitionRecord"("candidateId");
CREATE INDEX IF NOT EXISTS idx_logentry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX IF NOT EXISTS idx_logentry_level ON "LogEntry"(level);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- You can add some initial mock data here if needed for development, for example:
-- INSERT INTO "User" (name, email, password, role) VALUES 
-- ('Admin User', 'admin@canditrack.com', 'password', 'Admin') -- Again, password MUST be hashed in production
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO "Position" (title, department, "isOpen", description) VALUES
-- ('Software Engineer', 'Engineering', true, 'Develops and maintains software applications.')
-- ON CONFLICT DO NOTHING;
    