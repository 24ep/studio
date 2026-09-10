-- Index Removal Validation Script
-- This script validates that removing indexes won't break critical queries

-- ==============================================
-- CRITICAL QUERY PATTERNS TO VALIDATE
-- ==============================================

-- 1. Validate applicant queries (most critical)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT c.*, p.title as "positionTitle", r.name as "recruiterName"
FROM "applicant" c
LEFT JOIN "Position" p ON c."positionId" = p.id
LEFT JOIN "User" r ON c."recruiterId" = r.id
WHERE c."statusId" = 'some-uuid'
ORDER BY c."applicationDate" DESC
LIMIT 50;

-- 2. Validate Position queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, g.name as "gradeName"
FROM "Position" p
LEFT JOIN "Grade" g ON p."gradeId" = g.id
WHERE p."isOpen" = true
ORDER BY p."createdAt" DESC;

-- 3. Validate User queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.*
FROM "User" u
WHERE u."role" = 'admin' AND u."isActive" = true;

-- 4. Validate UploadQueue queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT uq.*, p.title as "positionTitle"
FROM "UploadQueue" uq
LEFT JOIN "Position" p ON uq."positionId" = p.id
WHERE uq."status" = 'pending'
ORDER BY uq."uploadDate" DESC;

-- 5. Validate SLA notification queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.title, p.department, p."recruiterId", u.name, g.name, g."sla_days"
FROM "Position" p
LEFT JOIN "User" u ON p."recruiterId" = u.id
LEFT JOIN "Grade" g ON p."gradeId" = g.id
WHERE p."gradeId" IS NOT NULL
  AND p."isOpen" = true;

-- ==============================================
-- PERFORMANCE COMPARISON QUERIES
-- ==============================================

-- Before removing indexes, run these queries and note the execution time
-- After removing indexes, run the same queries and compare

-- Query 1: applicant filtering by position and status
\timing on
SELECT COUNT(*) FROM "applicant" WHERE "positionId" = 'some-uuid' AND "statusId" = 'some-uuid';
\timing off

-- Query 2: Position filtering by recruiter and open status
\timing on
SELECT COUNT(*) FROM "Position" WHERE "recruiterId" = 'some-uuid' AND "isOpen" = true;
\timing off

-- Query 3: User filtering by role and active status
\timing on
SELECT COUNT(*) FROM "User" WHERE "role" = 'admin' AND "isActive" = true;
\timing off

-- Query 4: UploadQueue filtering by status
\timing on
SELECT COUNT(*) FROM "UploadQueue" WHERE "status" = 'pending';
\timing off

-- ==============================================
-- INDEX USAGE MONITORING
-- ==============================================

-- Monitor index usage after changes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check for any queries that might be slow after index removal
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%applicant%' OR query LIKE '%Position%' OR query LIKE '%User%'
ORDER BY mean_time DESC
LIMIT 10;
