
-- Drop existing tables if they exist (optional, for a clean start during dev)
-- Consider implications if you have existing data you want to keep.
DROP TABLE IF EXISTS "TransitionRecord";
DROP TABLE IF EXISTS "Candidate";
DROP TABLE IF EXISTS "Position";
DROP TABLE IF EXISTS "UserModulePermission";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "LogEntry";
DROP TABLE IF EXISTS "RecruitmentStage"; -- New table

-- User Table
CREATE TABLE "User" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- For credentials provider
  "avatarUrl" VARCHAR(1024),
  "dataAiHint" VARCHAR(255), -- For AI-generated avatar hints
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Hiring Manager')),
  "modulePermissions" TEXT[] DEFAULT '{}', -- Array of PlatformModuleId strings
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Position Table
CREATE TABLE "Position" (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  description TEXT,
  "isOpen" BOOLEAN DEFAULT true,
  position_level VARCHAR(100), -- e.g., Senior, Mid-Level, Entry-Level
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RecruitmentStage Table (New Table)
CREATE TABLE "RecruitmentStage" (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE NOT NULL, -- True for default stages, false for custom
  sort_order INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Table
CREATE TABLE "Candidate" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE, -- Can be NULL initially if parsed from resume without email
  phone VARCHAR(50),
  "resumePath" VARCHAR(1024), -- Path in MinIO
  "parsedData" JSONB, -- Store parsed resume data as JSON
  "positionId" UUID REFERENCES "Position"(id) ON DELETE SET NULL, -- Applied position
  "fitScore" INTEGER DEFAULT 0, -- 0-100
  status VARCHAR(100) NOT NULL, -- Current status/stage name, should match a name in RecruitmentStage
  "applicationDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "recruiterId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- Assigned recruiter
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TransitionRecord Table
-- This table logs the history of candidate status changes.
CREATE TABLE "TransitionRecord" (
  id UUID PRIMARY KEY,
  "candidateId" UUID NOT NULL REFERENCES "Candidate"(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  stage VARCHAR(100) NOT NULL, -- Stage name, should match a name in RecruitmentStage
  notes TEXT,
  "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User who made the change
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LogEntry Table (for audit logs and general application logs)
CREATE TABLE "LogEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT')),
  message TEXT NOT NULL,
  source VARCHAR(255), -- e.g., API, Auth, ServiceName
  "actingUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- User associated with the log, if any
  details JSONB, -- Any additional structured data
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For table record creation, distinct from log event timestamp
);

-- Indexes for performance
CREATE INDEX idx_candidate_email ON "Candidate"(email);
CREATE INDEX idx_candidate_position_id ON "Candidate"("positionId");
CREATE INDEX idx_candidate_status ON "Candidate"(status);
CREATE INDEX idx_candidate_recruiter_id ON "Candidate"("recruiterId");
CREATE INDEX idx_position_title ON "Position"(title);
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_logentry_timestamp ON "LogEntry"(timestamp);
CREATE INDEX idx_logentry_level ON "LogEntry"(level);
CREATE INDEX idx_logentry_source ON "LogEntry"(source);
CREATE INDEX idx_recruitmentstage_name ON "RecruitmentStage"(name);


-- Seed initial data

-- Default Admin User (Password: "nccadmin")
-- Bcrypt hash for 'nccadmin' is $2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly
-- IMPORTANT: Replace with your own secure password and generate a new hash in production.
INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User', 'admin@ncc.com', '$2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly', 'Admin', 'https://placehold.co/100x100/3455DB/FFFFFF.png?text=AU', 'profile admin', '{"CANDIDATES_VIEW", "CANDIDATES_MANAGE", "POSITIONS_VIEW", "POSITIONS_MANAGE", "USERS_MANAGE", "SETTINGS_ACCESS", "LOGS_VIEW"}');

-- Seed Default Recruitment Stages
INSERT INTO "RecruitmentStage" (id, name, description, is_system, sort_order) VALUES
(gen_random_uuid(), 'Applied', 'Candidate has submitted an application.', TRUE, 10),
(gen_random_uuid(), 'Screening', 'Application is being reviewed.', TRUE, 20),
(gen_random_uuid(), 'Shortlisted', 'Candidate has been shortlisted for consideration.', TRUE, 30),
(gen_random_uuid(), 'Interview Scheduled', 'An interview has been scheduled with the candidate.', TRUE, 40),
(gen_random_uuid(), 'Interviewing', 'Candidate is currently in the interview process.', TRUE, 50),
(gen_random_uuid(), 'Offer Extended', 'A job offer has been extended to the candidate.', TRUE, 60),
(gen_random_uuid(), 'Offer Accepted', 'Candidate has accepted the job offer.', TRUE, 70),
(gen_random_uuid(), 'Hired', 'Candidate has been hired.', TRUE, 80),
(gen_random_uuid(), 'Rejected', 'Candidate has been rejected.', TRUE, 90),
(gen_random_uuid(), 'On Hold', 'Candidate application is temporarily on hold.', TRUE, 100);

-- Sample Positions
INSERT INTO "Position" (id, title, department, description, "isOpen", position_level) VALUES
(gen_random_uuid(), 'Senior Software Engineer', 'Engineering', 'Develops and maintains complex software applications using modern technologies. Requires 5+ years of experience.', TRUE, 'senior level'),
(gen_random_uuid(), 'Product Manager - Mobile', 'Product', 'Leads the product strategy and roadmap for our mobile applications. Collaborates with design and engineering teams.', TRUE, 'manager'),
(gen_random_uuid(), 'UX/UI Designer', 'Design', 'Creates intuitive and visually appealing user experiences and interfaces for web and mobile platforms.', TRUE, 'mid level'),
(gen_random_uuid(), 'Marketing Specialist', 'Marketing', 'Develops and executes marketing campaigns to drive brand awareness and lead generation.', FALSE, 'mid level'),
(gen_random_uuid(), 'Data Analyst', 'Analytics', 'Collects, analyzes, and interprets large datasets to provide actionable insights for business decisions.', TRUE, 'entry level');

-- Sample Recruiters (Passwords: "password123")
-- Hash for "password123": $2b$10$E9gP9j8wL9cKqYhP.oR.3u9W2hTqgMv1xYj.G4jK9aM7fE4ZqS.uS
INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions") VALUES
(gen_random_uuid(), 'Jane Recruiter', 'jane.recruiter@ncc.com', '$2b$10$E9gP9j8wL9cKqYhP.oR.3u9W2hTqgMv1xYj.G4jK9aM7fE4ZqS.uS', 'Recruiter', 'https://placehold.co/100x100/FFC107/000000.png?text=JR', 'profile woman', '{"CANDIDATES_VIEW", "POSITIONS_VIEW"}'),
(gen_random_uuid(), 'John Recruiter', 'john.recruiter@ncc.com', '$2b$10$E9gP9j8wL9cKqYhP.oR.3u9W2hTqgMv1xYj.G4jK9aM7fE4ZqS.uS', 'Recruiter', 'https://placehold.co/100x100/4CAF50/FFFFFF.png?text=JR', 'profile man', '{"CANDIDATES_VIEW", "CANDIDATES_MANAGE", "POSITIONS_VIEW"}');

-- Sample Hiring Manager (Password: "password123")
INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions") VALUES
(gen_random_uuid(), 'Mike Manager', 'mike.manager@ncc.com', '$2b$10$E9gP9j8wL9cKqYhP.oR.3u9W2hTqgMv1xYj.G4jK9aM7fE4ZqS.uS', 'Hiring Manager', 'https://placehold.co/100x100/9C27B0/FFFFFF.png?text=MM', 'profile person', '{"CANDIDATES_VIEW", "POSITIONS_VIEW"}');

-- Sample Candidates (can be added later or via application)
-- Make sure to use Position IDs from the INSERTs above if you associate them directly.
-- For example:
-- INSERT INTO "Candidate" (id, name, email, phone, "positionId", "fitScore", status, "applicationDate", "recruiterId", "parsedData") VALUES
-- (gen_random_uuid(), 'Alice Wonderland', 'alice@example.com', '555-1234', (SELECT id FROM "Position" WHERE title = 'Senior Software Engineer' LIMIT 1), 85, 'Interview Scheduled', NOW() - interval '15 day', (SELECT id FROM "User" WHERE email = 'jane.recruiter@ncc.com' LIMIT 1), '{"personal_info": {"firstname": "Alice", "lastname": "Wonderland"}, "contact_info": {"email": "alice@example.com"}}'),
-- (gen_random_uuid(), 'Bob The Builder', 'bob@example.com', '555-5678', (SELECT id FROM "Position" WHERE title = 'Product Manager - Mobile' LIMIT 1), 92, 'Offer Extended', NOW() - interval '5 day', (SELECT id FROM "User" WHERE email = 'john.recruiter@ncc.com' LIMIT 1), '{"personal_info": {"firstname": "Bob", "lastname": "The Builder"}, "contact_info": {"email": "bob@example.com"}}');

-- Default Log entry to indicate database initialized
INSERT INTO "LogEntry" (level, message, source, details) VALUES
('AUDIT', 'Database schema initialized and default data seeded successfully.', 'System:InitDB', '{"script": "init-db.sql"}');

-- End of script
    