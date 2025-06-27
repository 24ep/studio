-- Fix LogEntry table UUID fields
-- Change actingUserId from TEXT to UUID
ALTER TABLE "LogEntry" ALTER COLUMN "actingUserId" TYPE UUID USING "actingUserId"::UUID;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    -- Add foreign key for actingUserId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LogEntry_actingUserId_fkey'
    ) THEN
        ALTER TABLE "LogEntry" 
        ADD CONSTRAINT "LogEntry_actingUserId_fkey" 
        FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$; 