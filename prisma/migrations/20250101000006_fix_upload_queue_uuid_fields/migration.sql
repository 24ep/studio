-- Fix upload_queue table UUID fields
-- Change created_by from TEXT to UUID
ALTER TABLE "upload_queue" ALTER COLUMN "created_by" TYPE UUID USING "created_by"::UUID;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    -- Add foreign key for created_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'upload_queue_created_by_fkey'
    ) THEN
        ALTER TABLE "upload_queue" 
        ADD CONSTRAINT "upload_queue_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$; 