-- Create RecruitmentStage table if it doesn't exist
CREATE TABLE IF NOT EXISTS "RecruitmentStage" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recruitment_stage_name ON "RecruitmentStage"(name);
CREATE INDEX IF NOT EXISTS idx_recruitment_stage_sort_order ON "RecruitmentStage"(sort_order);

-- Insert default system recruitment stages
INSERT INTO "RecruitmentStage" (id, name, description, is_system, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Applied', 'Candidate has submitted their application', true, 1),
('550e8400-e29b-41d4-a716-446655440002', 'Screening', 'Initial screening of candidate qualifications', true, 2),
('550e8400-e29b-41d4-a716-446655440003', 'Shortlisted', 'Candidate has been shortlisted for further consideration', true, 3),
('550e8400-e29b-41d4-a716-446655440004', 'Interview Scheduled', 'Interview has been scheduled with the candidate', true, 4),
('550e8400-e29b-41d4-a716-446655440005', 'Interviewing', 'Candidate is currently in the interview process', true, 5),
('550e8400-e29b-41d4-a716-446655440006', 'Offer Extended', 'Job offer has been extended to the candidate', true, 6),
('550e8400-e29b-41d4-a716-446655440007', 'Offer Accepted', 'Candidate has accepted the job offer', true, 7),
('550e8400-e29b-41d4-a716-446655440008', 'Hired', 'Candidate has been hired and started employment', true, 8),
('550e8400-e29b-41d4-a716-446655440009', 'Rejected', 'Candidate has been rejected from the process', true, 9),
('550e8400-e29b-41d4-a716-446655440010', 'On Hold', 'Candidate application is temporarily on hold', true, 10)
ON CONFLICT (name) DO NOTHING;

-- Add dataAiHint column to candidates table if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='candidates' AND column_name='dataAiHint'
    ) THEN
        ALTER TABLE "candidates" ADD COLUMN "dataAiHint" VARCHAR(255);
    END IF;
END $$; 