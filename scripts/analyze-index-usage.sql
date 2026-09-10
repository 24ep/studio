-- Index Usage Analysis Script
-- This script analyzes which indexes are actually being used in the database

-- Check index usage statistics (requires pg_stat_user_indexes)
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

-- Check for unused indexes (indexes with 0 scans)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND idx_scan = 0
ORDER BY tablename, indexname;

-- Check table sizes to understand impact
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
