-- Fix TransitionRecord table UUID fields
-- Change candidateId from TEXT to UUID
ALTER TABLE "TransitionRecord" ALTER COLUMN "candidateId" TYPE UUID USING "candidateId"::UUID;

-- Change actingUserId from TEXT to UUID
ALTER TABLE "TransitionRecord" ALTER COLUMN "actingUserId" TYPE UUID USING "actingUserId"::UUID;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for candidateId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'TransitionRecord_candidateId_fkey'
    ) THEN
        ALTER TABLE "TransitionRecord" 
        ADD CONSTRAINT "TransitionRecord_candidateId_fkey" 
        FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for actingUserId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'TransitionRecord_actingUserId_fkey'
    ) THEN
        ALTER TABLE "TransitionRecord" 
        ADD CONSTRAINT "TransitionRecord_actingUserId_fkey" 
        FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$; 