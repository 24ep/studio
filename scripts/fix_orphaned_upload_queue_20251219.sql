-- ============================================================================
-- Upload Queue Cleanup Script
-- Date: 2025-12-19
-- Purpose: Find and reset orphaned upload_queue records that were marked as 
--          'success' but have no associated applicant data
-- ============================================================================

-- ============================================================================
-- STEP 1: BACKUP - Create a backup of affected records before making changes
-- ============================================================================
-- Run this first to save the current state of records that will be modified

CREATE TABLE IF NOT EXISTS upload_queue_backup_20251219 AS
SELECT * FROM upload_queue
WHERE id IN (
  SELECT uq.id
  FROM upload_queue uq
  LEFT JOIN "applicant" c ON c.id = CAST(uq.webhook_payload->>'applicant_id' AS UUID)
  WHERE uq.status = 'success'
    AND uq.completed_date >= '2025-12-19 00:00:00'
    AND uq.completed_date < '2025-12-20 00:00:00'
    AND (
      uq.webhook_payload->>'applicant_id' IS NULL 
      OR c.id IS NULL
    )
);

-- Verify backup was created
SELECT COUNT(*) as backup_record_count FROM upload_queue_backup_20251219;

-- ============================================================================
-- STEP 2: VERIFY - Find and review the problematic records
-- ============================================================================
-- Run this to see which records will be affected BEFORE making any changes

SELECT 
  uq.id,
  uq.file_name,
  uq.status,
  uq.completed_date,
  uq.process_date,
  uq.error,
  uq.webhook_payload->>'applicant_id' as webhook_applicant_id,
  c.id as actual_applicant_id
FROM upload_queue uq
LEFT JOIN "applicant" c ON c.id = CAST(uq.webhook_payload->>'applicant_id' AS UUID)
WHERE uq.status = 'success'
  AND uq.completed_date >= '2025-12-19 00:00:00'
  AND uq.completed_date < '2025-12-20 00:00:00'
  AND (
    uq.webhook_payload->>'applicant_id' IS NULL 
    OR c.id IS NULL
  )
ORDER BY uq.completed_date DESC;

-- ============================================================================
-- STEP 3: UPDATE - Reset orphaned records back to 'queued' status
-- ============================================================================
-- Only run this AFTER reviewing the records in Step 2

UPDATE upload_queue
SET 
  status = 'queued',
  completed_date = NULL,
  process_date = NULL,
  error = 'Reset on 2025-12-19: No applicant was created during previous processing',
  updated_at = NOW()
WHERE id IN (
  SELECT uq.id
  FROM upload_queue uq
  LEFT JOIN "applicant" c ON c.id = CAST(uq.webhook_payload->>'applicant_id' AS UUID)
  WHERE uq.status = 'success'
    AND uq.completed_date >= '2025-12-19 00:00:00'
    AND uq.completed_date < '2025-12-20 00:00:00'
    AND (
      uq.webhook_payload->>'applicant_id' IS NULL 
      OR c.id IS NULL
    )
);

-- ============================================================================
-- STEP 4: VERIFY UPDATE - Check the results
-- ============================================================================

SELECT 
  status,
  COUNT(*) as count
FROM upload_queue
WHERE updated_at >= NOW() - INTERVAL '5 minutes'
GROUP BY status;

-- ============================================================================
-- ROLLBACK (if needed) - Restore from backup
-- ============================================================================
-- Only run this if you need to undo the changes

-- UPDATE upload_queue uq
-- SET 
--   status = b.status,
--   completed_date = b.completed_date,
--   process_date = b.process_date,
--   error = b.error,
--   updated_at = b.updated_at
-- FROM upload_queue_backup_20251219 b
-- WHERE uq.id = b.id;

-- ============================================================================
-- CLEANUP - Drop backup table after confirming everything is working
-- ============================================================================
-- Run this only after confirming the update was successful and processing works

-- DROP TABLE IF EXISTS upload_queue_backup_20251219;
