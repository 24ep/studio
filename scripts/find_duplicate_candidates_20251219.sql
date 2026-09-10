-- ============================================================================
-- Check for Duplicate applicants with Same Position
-- Date: 2025-12-19
-- Purpose: Find applicants that appear to be duplicates (same name/email) 
--          applied to the same position
-- ============================================================================

-- ============================================================================
-- QUERY 1: Find duplicate applicants by email + position
-- ============================================================================

SELECT 
  c.email,
  c."positionId",
  p.title as position_title,
  COUNT(*) as duplicate_count,
  STRING_AGG(c.id::text, ', ') as applicant_ids,
  STRING_AGG(c.name, ', ') as applicant_names,
  STRING_AGG(c."createdAt"::text, ', ') as created_dates
FROM "applicant" c
LEFT JOIN "Position" p ON p.id = c."positionId"
WHERE c.email IS NOT NULL 
  AND c.email != ''
  AND c."positionId" IS NOT NULL
GROUP BY c.email, c."positionId", p.title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, c.email;

-- ============================================================================
-- QUERY 2: Find duplicate applicants by name + position (for applicants without email)
-- ============================================================================

SELECT 
  c.name,
  c."positionId",
  p.title as position_title,
  COUNT(*) as duplicate_count,
  STRING_AGG(c.id::text, ', ') as applicant_ids,
  STRING_AGG(COALESCE(c.email, 'no-email'), ', ') as emails,
  STRING_AGG(c."createdAt"::text, ', ') as created_dates
FROM "applicant" c
LEFT JOIN "Position" p ON p.id = c."positionId"
WHERE c."positionId" IS NOT NULL
GROUP BY c.name, c."positionId", p.title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, c.name;

-- ============================================================================
-- QUERY 3: Detailed view of duplicates (for review before deletion)
-- ============================================================================

WITH duplicates AS (
  SELECT 
    c.email,
    c."positionId",
    COUNT(*) as cnt
  FROM "applicant" c
  WHERE c.email IS NOT NULL 
    AND c.email != ''
    AND c."positionId" IS NOT NULL
  GROUP BY c.email, c."positionId"
  HAVING COUNT(*) > 1
)
SELECT 
  c.id,
  c.name,
  c.email,
  c."positionId",
  p.title as position_title,
  c.statusId,
  c."createdAt",
  c."updatedAt",
  c."recruiterId"
FROM "applicant" c
JOIN duplicates d ON c.email = d.email AND c."positionId" = d."positionId"
LEFT JOIN "Position" p ON p.id = c."positionId"
ORDER BY c.email, c."positionId", c."createdAt";

-- ============================================================================
-- QUERY 4: Count summary of duplicates
-- ============================================================================

SELECT 
  'Duplicate applicants by email + position' as check_type,
  COUNT(DISTINCT (c.email, c."positionId")) as unique_duplicate_pairs,
  SUM(cnt) - COUNT(*) as total_extra_duplicates
FROM (
  SELECT 
    c.email,
    c."positionId",
    COUNT(*) as cnt
  FROM "applicant" c
  WHERE c.email IS NOT NULL 
    AND c.email != ''
    AND c."positionId" IS NOT NULL
  GROUP BY c.email, c."positionId"
  HAVING COUNT(*) > 1
) sub
JOIN "applicant" c ON c.email = sub.email AND c."positionId" = sub."positionId";

-- ============================================================================
-- STEP 5: BACKUP duplicates before deletion
-- ============================================================================

CREATE TABLE IF NOT EXISTS applicant_duplicates_backup_20251219 AS
SELECT c.*
FROM "applicant" c
WHERE c.email IS NOT NULL 
  AND c.email != ''
  AND c."positionId" IS NOT NULL
  AND c.id NOT IN (
    -- These are the ones we'll KEEP (oldest)
    SELECT DISTINCT ON (email, "positionId") id
    FROM "applicant"
    WHERE email IS NOT NULL AND email != '' AND "positionId" IS NOT NULL
    ORDER BY email, "positionId", "createdAt" ASC
  );

-- Verify backup
SELECT COUNT(*) as duplicates_to_delete FROM applicant_duplicates_backup_20251219;

-- ============================================================================
-- STEP 6: DELETE duplicates (KEEP THE OLDEST ONE)
-- ============================================================================
-- This keeps the oldest applicant (first created) and deletes newer duplicates

DELETE FROM "applicant"
WHERE id IN (
  SELECT c.id
  FROM "applicant" c
  WHERE c.email IS NOT NULL 
    AND c.email != ''
    AND c."positionId" IS NOT NULL
    AND c.id NOT IN (
      -- Keep the oldest applicant for each email + position combination
      SELECT DISTINCT ON (email, "positionId") id
      FROM "applicant"
      WHERE email IS NOT NULL AND email != '' AND "positionId" IS NOT NULL
      ORDER BY email, "positionId", "createdAt" ASC
    )
);

-- ============================================================================
-- STEP 7: Verify deletion worked
-- ============================================================================

-- Should return 0 duplicates now
SELECT 
  c.email,
  c."positionId",
  COUNT(*) as duplicate_count
FROM "applicant" c
WHERE c.email IS NOT NULL 
  AND c.email != ''
  AND c."positionId" IS NOT NULL
GROUP BY c.email, c."positionId"
HAVING COUNT(*) > 1;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- INSERT INTO "applicant" SELECT * FROM applicant_duplicates_backup_20251219;

-- ============================================================================
-- CLEANUP - Drop backup after confirming
-- ============================================================================
-- DROP TABLE IF EXISTS applicant_duplicates_backup_20251219;
