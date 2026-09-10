-- ============================================================================
-- Find Orphaned Files from Deleted Duplicate applicants
-- Date: 2025-12-19
-- Purpose: Identify files in MinIO that originated from the deleted duplicate applicants.
--          Since we don't have a direct link to deleted applicants anymore, we'll look for:
--          1. Attachments/Resumes in `upload_queue` that were processed but have no matching `applicant`.
--          2. Records in `Attachment` table that point to non-existent applicants (if cascade delete failed).
-- ============================================================================

-- ============================================================================
-- QUERY 1: Find orphaned attachments in upload_queue (processed but applicant gone)
-- ============================================================================
-- These are files that were successfully processed but their resulting applicant 
-- is no longer in the database (likely deleted as a duplicate).

SELECT 
  uq.id,
  uq.file_name,
  uq.file_path,
  uq.status,
  uq.completed_date,
  uq.webhook_payload->>'applicant_id' as original_applicant_id
FROM upload_queue uq
LEFT JOIN "applicant" c ON c.id = CAST(uq.webhook_payload->>'applicant_id' AS UUID)
WHERE uq.status = 'success'
  AND uq.file_path IS NOT NULL
  AND uq.webhook_payload->>'applicant_id' IS NOT NULL
  AND c.id IS NULL
ORDER BY uq.completed_date DESC;

-- ============================================================================
-- QUERY 2: Find orphaned records in Attachment table (if cascade failed)
-- ============================================================================

SELECT 
  a.id,
  a."fileName",
  a."filePath",
  a."applicantId",
  a."uploadedAt"
FROM "Attachment" a
LEFT JOIN "applicant" c ON c.id = a."applicantId"
WHERE a."applicantId" IS NOT NULL
  AND c.id IS NULL;

-- ============================================================================
-- QUERY 3: Find orphaned Resume Paths (from applicants that were deleted?)
-- ============================================================================
-- Note: Requires logs or backup table to know which applicants were deleted.
-- If you have the backup table `applicant_duplicates_backup_20251219`, we can check it.

SELECT 
  b.id as deleted_applicant_id,
  b.name,
  b."resumePath" as orphaned_resume_path,
  b."createdAt",
  a."filePath" as orphaned_attachment_path
FROM applicant_duplicates_backup_20251219 b
LEFT JOIN "Attachment" a ON a."applicantId" = b.id;

-- ============================================================================
-- INSTRUCTIONS FOR FILE CLEANUP:
-- ============================================================================
-- The SQL above only identifies the file paths. You will need to delete the actual
-- files from MinIO storage separately.
--
-- 1. Run Query 3 to get the list of file paths from the deleted applicants.
-- 2. Use a script or MinIO client to delete these `orphaned_resume_path` and `orphaned_attachment_path` files.
-- 3. Also check Query 1 for files in upload_queue that are now unlinked.
