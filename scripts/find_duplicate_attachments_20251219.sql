-- ============================================================================
-- Find Duplicate Attachments for applicants
-- Date: 2025-12-19
-- Purpose: Find and remove duplicate attachments (same filename) for the same applicant.
-- ============================================================================

-- ============================================================================
-- QUERY 1: Find applicants with duplicate attachment filenames
-- ============================================================================

SELECT 
  a."applicantId",
  c.name as applicant_name,
  a."fileName",
  COUNT(*) as duplicate_count,
  STRING_AGG(a.id::text, ', ') as attachment_ids,
  STRING_AGG(a."filePath", ', ') as file_paths,
  STRING_AGG(a."isPrimary"::text, ', ') as is_primary_flags,
  STRING_AGG(a."uploadedAt"::text, ', ') as upload_dates
FROM "Attachment" a
JOIN "applicant" c ON c.id = a."applicantId"
WHERE a."applicantId" IS NOT NULL
GROUP BY a."applicantId", c.name, a."fileName"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, c.name;

-- ============================================================================
-- QUERY 1.5: Find duplicate FILE PATHS (different attachment records pointing to same file)
-- ============================================================================

SELECT 
  a."filePath",
  COUNT(*) as duplicate_count,
  STRING_AGG(a.id::text, ', ') as attachment_ids,
  STRING_AGG(c.name, ', ') as applicant_names,
  STRING_AGG(a."applicantId"::text, ', ') as applicant_ids
FROM "Attachment" a
LEFT JOIN "applicant" c ON c.id = a."applicantId"
GROUP BY a."filePath"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================================================
-- QUERY 2: Detailed view of duplicate attachments
-- ============================================================================

WITH duplicates AS (
  SELECT 
    "applicantId",
    "fileName"
  FROM "Attachment"
  WHERE "applicantId" IS NOT NULL
  GROUP BY "applicantId", "fileName"
  HAVING COUNT(*) > 1
)
SELECT 
  a.id,
  a."applicantId",
  c.name as applicant_name,
  a."fileName",
  a."filePath",
  a."label",
  a."isPrimary",
  a."uploadedAt"
FROM "Attachment" a
JOIN duplicates d ON a."applicantId" = d."applicantId" AND a."fileName" = d."fileName"
JOIN "applicant" c ON c.id = a."applicantId"
ORDER BY a."applicantId", a."fileName", a."uploadedAt" DESC;

-- ============================================================================
-- STEP 3: BACKUP before deletion
-- ============================================================================

CREATE TABLE IF NOT EXISTS attachment_duplicates_backup_20251219 AS
SELECT a.*
FROM "Attachment" a
WHERE a."applicantId" IS NOT NULL
  AND a.id NOT IN (
    -- Keep the "best" version:
    -- 1. Prefer isPrimary = true
    -- 2. Then prefer newest uploadedAt
    SELECT DISTINCT ON ("applicantId", "fileName") id
    FROM "Attachment"
    WHERE "applicantId" IS NOT NULL
    ORDER BY "applicantId", "fileName", "isPrimary" DESC, "uploadedAt" DESC
  )
  AND (a."applicantId", a."fileName") IN (
    SELECT "applicantId", "fileName"
    FROM "Attachment"
    WHERE "applicantId" IS NOT NULL
    GROUP BY "applicantId", "fileName"
    HAVING COUNT(*) > 1
  );

-- Verify backup count
SELECT COUNT(*) as attachments_to_delete FROM attachment_duplicates_backup_20251219;

-- ============================================================================
-- STEP 4: DELETE duplicates
-- ============================================================================
-- Strategy: Keep 1 attachment per filename per applicant.
-- Priority: Keep 'isPrimary' if exists, otherwise keep the NEWEST one.

-- DELETE FROM "Attachment"
-- WHERE id IN (
--   SELECT id FROM attachment_duplicates_backup_20251219
-- );

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Should be 0
SELECT 
  a."applicantId",
  a."fileName",
  COUNT(*) as duplicate_count
FROM "Attachment" a
WHERE a."applicantId" IS NOT NULL
GROUP BY a."applicantId", a."fileName"
HAVING COUNT(*) > 1;

-- ============================================================================
-- CLEANUP
-- ============================================================================
-- DROP TABLE IF EXISTS attachment_duplicates_backup_20251219;
