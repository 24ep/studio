-- Fix NotificationSetting table UUID fields
-- Change event_id from TEXT to UUID
ALTER TABLE "NotificationSetting" ALTER COLUMN "event_id" TYPE UUID USING "event_id"::UUID;

-- Change channel_id from TEXT to UUID
ALTER TABLE "NotificationSetting" ALTER COLUMN "channel_id" TYPE UUID USING "channel_id"::UUID;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for event_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'NotificationSetting_event_id_fkey'
    ) THEN
        ALTER TABLE "NotificationSetting" 
        ADD CONSTRAINT "NotificationSetting_event_id_fkey" 
        FOREIGN KEY ("event_id") REFERENCES "NotificationEvent"("id") ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for channel_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'NotificationSetting_channel_id_fkey'
    ) THEN
        ALTER TABLE "NotificationSetting" 
        ADD CONSTRAINT "NotificationSetting_channel_id_fkey" 
        FOREIGN KEY ("channel_id") REFERENCES "NotificationChannel"("id") ON DELETE CASCADE;
    END IF;
END $$; 