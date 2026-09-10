-- Index Optimization Script
-- Based on query pattern analysis, this script removes unused indexes

-- ==============================================
-- ANALYSIS OF CURRENT INDEXES AND USAGE PATTERNS
-- ==============================================

-- Based on the codebase analysis, here are the findings:

-- FREQUENTLY USED INDEXES (KEEP THESE):
-- - applicant.positionId (used in JOINs)
-- - applicant.recruiterId (used in JOINs) 
-- - applicant.statusId (used in JOINs)
-- - applicant.sourceId (used in JOINs)
-- - applicant.fitScore (used in WHERE clauses and sorting)
-- - applicant.applicationDate (used in ORDER BY)
-- - Position.recruiterId (used in WHERE clauses)
-- - Position.gradeId (used in JOINs and WHERE clauses)
-- - Position.isOpen (used in WHERE clauses)
-- - User.role (used in WHERE clauses)
-- - User.isActive (used in WHERE clauses)
-- - User.email (used in WHERE clauses)

-- POTENTIALLY UNUSED INDEXES (applicantS FOR REMOVAL):
-- - Single column indexes that are not frequently queried
-- - Indexes on fields that are only used in SELECT but not WHERE/ORDER BY
-- - Redundant indexes where a composite index would be better

-- ==============================================
-- INDEX REMOVAL SCRIPT
-- ==============================================

-- Remove unused single-column indexes
-- (Run these one by one and monitor performance)

-- 1. Remove indexes on fields that are rarely used in WHERE clauses
DROP INDEX IF EXISTS "User_avatarUrl_idx";
DROP INDEX IF EXISTS "User_image_idx";
DROP INDEX IF EXISTS "User_dataAiHint_idx";
DROP INDEX IF EXISTS "User_personalColor_idx";
DROP INDEX IF EXISTS "User_createdAt_idx";
DROP INDEX IF EXISTS "User_updatedAt_idx";

-- 2. Remove indexes on Position fields that are rarely filtered
DROP INDEX IF EXISTS "Position_description_idx";
DROP INDEX IF EXISTS "Position_positionAttribute_idx";
DROP INDEX IF EXISTS "Position_companyId_idx";
DROP INDEX IF EXISTS "Position_createdAt_idx";
DROP INDEX IF EXISTS "Position_updatedAt_idx";

-- 3. Remove indexes on applicant fields that are rarely filtered
DROP INDEX IF EXISTS "applicant_phone_idx";
DROP INDEX IF EXISTS "applicant_resumePath_idx";
DROP INDEX IF EXISTS "applicant_avatarUrl_idx";
DROP INDEX IF EXISTS "applicant_dataAiHint_idx";
DROP INDEX IF EXISTS "applicant_assignmentJustification_idx";
DROP INDEX IF EXISTS "applicant_companyId_idx";
DROP INDEX IF EXISTS "applicant_updatedAt_idx";
DROP INDEX IF EXISTS "applicant_createdAt_idx";

-- 4. Remove indexes on Grade fields that are rarely filtered
DROP INDEX IF EXISTS "Grade_label_idx";
DROP INDEX IF EXISTS "Grade_description_idx";
DROP INDEX IF EXISTS "Grade_color_idx";
DROP INDEX IF EXISTS "Grade_createdAt_idx";
DROP INDEX IF EXISTS "Grade_updatedAt_idx";

-- 5. Remove indexes on RecruitmentStage fields that are rarely filtered
DROP INDEX IF EXISTS "RecruitmentStage_description_idx";
DROP INDEX IF EXISTS "RecruitmentStage_createdAt_idx";
DROP INDEX IF EXISTS "RecruitmentStage_updatedAt_idx";

-- 6. Remove indexes on TransitionRecord fields that are rarely filtered
DROP INDEX IF EXISTS "TransitionRecord_notes_idx";
DROP INDEX IF EXISTS "TransitionRecord_createdAt_idx";
DROP INDEX IF EXISTS "TransitionRecord_updatedAt_idx";

-- 7. Remove indexes on LogEntry fields that are rarely filtered
DROP INDEX IF EXISTS "LogEntry_message_idx";
DROP INDEX IF EXISTS "LogEntry_createdAt_idx";
DROP INDEX IF EXISTS "LogEntry_updatedAt_idx";

-- 8. Remove indexes on UserGroup/UserTeam fields that are rarely filtered
DROP INDEX IF EXISTS "UserGroup_createdAt_idx";
DROP INDEX IF EXISTS "UserGroup_updatedAt_idx";
DROP INDEX IF EXISTS "UserTeam_createdAt_idx";
DROP INDEX IF EXISTS "UserTeam_updatedAt_idx";

-- 9. Remove indexes on CustomFieldDefinition fields that are rarely filtered
DROP INDEX IF EXISTS "CustomFieldDefinition_createdAt_idx";
DROP INDEX IF EXISTS "CustomFieldDefinition_updatedAt_idx";

-- 10. Remove indexes on CustomFieldValue fields that are rarely filtered
DROP INDEX IF EXISTS "CustomFieldValue_createdAt_idx";
DROP INDEX IF EXISTS "CustomFieldValue_updatedAt_idx";

-- 11. Remove indexes on Attachment fields that are rarely filtered
DROP INDEX IF EXISTS "Attachment_filePath_idx";
DROP INDEX IF EXISTS "Attachment_fileSize_idx";
DROP INDEX IF EXISTS "Attachment_mimeType_idx";
DROP INDEX IF EXISTS "Attachment_createdAt_idx";
DROP INDEX IF EXISTS "Attachment_updatedAt_idx";

-- 12. Remove indexes on UploadQueue fields that are rarely filtered
DROP INDEX IF EXISTS "UploadQueue_fileSize_idx";
DROP INDEX IF EXISTS "UploadQueue_mimeType_idx";
DROP INDEX IF EXISTS "UploadQueue_createdAt_idx";
DROP INDEX IF EXISTS "UploadQueue_updatedAt_idx";

-- 13. Remove indexes on Dashboard fields that are rarely filtered
DROP INDEX IF EXISTS "Dashboard_createdAt_idx";
DROP INDEX IF EXISTS "Dashboard_updatedAt_idx";

-- 14. Remove indexes on DashboardWidget fields that are rarely filtered
DROP INDEX IF EXISTS "DashboardWidget_createdAt_idx";
DROP INDEX IF EXISTS "DashboardWidget_updatedAt_idx";

-- 15. Remove indexes on Notification fields that are rarely filtered
DROP INDEX IF EXISTS "Notification_createdAt_idx";
DROP INDEX IF EXISTS "Notification_updatedAt_idx";

-- 16. Remove indexes on Headcount fields that are rarely filtered
DROP INDEX IF EXISTS "Headcount_createdAt_idx";
DROP INDEX IF EXISTS "Headcount_updatedAt_idx";

-- 17. Remove indexes on WarningConfiguration fields that are rarely filtered
DROP INDEX IF EXISTS "WarningConfiguration_createdAt_idx";
DROP INDEX IF EXISTS "WarningConfiguration_updatedAt_idx";

-- 18. Remove indexes on Warning fields that are rarely filtered
DROP INDEX IF EXISTS "Warning_createdAt_idx";
DROP INDEX IF EXISTS "Warning_updatedAt_idx";

-- 19. Remove indexes on ExpertiseGroup fields that are rarely filtered
DROP INDEX IF EXISTS "ExpertiseGroup_createdAt_idx";
DROP INDEX IF EXISTS "ExpertiseGroup_updatedAt_idx";

-- 20. Remove indexes on ExpertiseSkill fields that are rarely filtered
DROP INDEX IF EXISTS "ExpertiseSkill_createdAt_idx";
DROP INDEX IF EXISTS "ExpertiseSkill_updatedAt_idx";

-- 21. Remove indexes on PersonalityGroup fields that are rarely filtered
DROP INDEX IF EXISTS "PersonalityGroup_createdAt_idx";
DROP INDEX IF EXISTS "PersonalityGroup_updatedAt_idx";

-- 22. Remove indexes on PersonalityTrait fields that are rarely filtered
DROP INDEX IF EXISTS "PersonalityTrait_createdAt_idx";
DROP INDEX IF EXISTS "PersonalityTrait_updatedAt_idx";

-- 23. Remove indexes on applicantEvaluation fields that are rarely filtered
DROP INDEX IF EXISTS "applicantEvaluation_createdAt_idx";
DROP INDEX IF EXISTS "applicantEvaluation_updatedAt_idx";

-- 24. Remove indexes on applicantEvaluationSkill fields that are rarely filtered
DROP INDEX IF EXISTS "applicantEvaluationSkill_createdAt_idx";
DROP INDEX IF EXISTS "applicantEvaluationSkill_updatedAt_idx";

-- 25. Remove indexes on applicantEvaluationTrait fields that are rarely filtered
DROP INDEX IF EXISTS "applicantEvaluationTrait_createdAt_idx";
DROP INDEX IF EXISTS "applicantEvaluationTrait_updatedAt_idx";

-- ==============================================
-- CREATE COMPOSITE INDEXES FOR BETTER PERFORMANCE
-- ==============================================

-- Create composite indexes for commonly used query patterns

-- 1. Composite index for applicant filtering and sorting
CREATE INDEX IF NOT EXISTS "applicant_position_status_fit_idx" 
ON "applicant"("positionId", "statusId", "fitScore");

-- 2. Composite index for applicant date-based queries
CREATE INDEX IF NOT EXISTS "applicant_application_date_status_idx" 
ON "applicant"("applicationDate", "statusId");

-- 3. Composite index for Position filtering
CREATE INDEX IF NOT EXISTS "Position_recruiter_open_idx" 
ON "Position"("recruiterId", "isOpen");

-- 4. Composite index for User role and active status
CREATE INDEX IF NOT EXISTS "User_role_active_idx" 
ON "User"("role", "isActive");

-- 5. Composite index for UploadQueue status and date
CREATE INDEX IF NOT EXISTS "UploadQueue_status_date_idx" 
ON "UploadQueue"("status", "uploadDate");

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check remaining indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Check for any remaining unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND idx_scan = 0
ORDER BY tablename, indexname;
