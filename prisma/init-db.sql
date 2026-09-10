-- Initialize hrive database with default data
-- This script works with the postgres user and studio_production database

-- Create default admin user. Prefer prisma/seed.ts for new deployments.
INSERT INTO "User" (id, name, email, password, role, "authentication_methods", "force_password_change", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@example.com',
  '$2a$10$dwiCxbUtCqnXeB2O8BmiyeWHL0e7rOqahafQAUACsnD4EZ9nGqPx2',
  'Admin',
  ARRAY['basic'],
  false,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Note: No default positions created - positions should be added through the UI

-- Create system-required recruitment stages. Optional workflow stages are loaded from AppKit.
INSERT INTO "RecruitmentStage" (id, name, description, "is_system", "sort_order")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Applied', 'applicant has submitted their application', true, 1),
  ('550e8400-e29b-41d4-a716-446655440008', 'Hired', 'applicant has been hired and started employment', true, 8),
  ('550e8400-e29b-41d4-a716-446655440009', 'Rejected', 'applicant has been rejected from the process', true, 9)
ON CONFLICT (name) DO UPDATE SET "is_system" = true;

-- Create default user groups
INSERT INTO "UserGroup" (id, name, description, permissions, "is_default", "is_system_role", "createdAt", "updatedAt")
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access', ARRAY['applicantS_VIEW','applicantS_VIEW_ALL','applicantS_VIEW_DETAILED','applicantS_CREATE','applicantS_EDIT_BASIC','applicantS_EDIT_SENSITIVE','applicantS_EDIT_BASIC_OWN','applicantS_EDIT_SENSITIVE_OWN','applicantS_EDIT_BASIC_ALL','applicantS_EDIT_SENSITIVE_ALL','applicantS_DELETE','applicantS_RESUMES_UPLOAD','applicantS_RESUMES_UPLOAD_OWN','applicantS_RESUMES_UPLOAD_ALL','applicantS_RESUMES_DELETE','applicantS_COMMENTS_VIEW','applicantS_COMMENTS_ADD','applicantS_COMMENTS_ADD_OWN','applicantS_COMMENTS_ADD_ALL','applicantS_COMMENTS_EDIT','applicantS_COMMENTS_VIEW_REMARK_ONLY','applicantS_ACTIVITIES_VIEW','applicantS_SOURCE_ASSIGN','applicantS_SOURCE_ASSIGN_BULK','applicantS_RECRUITER_ASSIGN','applicantS_RECRUITER_ASSIGN_OWN','applicantS_RECRUITER_ASSIGN_ALL','applicantS_RECRUITER_ASSIGN_BULK','applicantS_PIPELINE_STAGE_UPDATE','applicantS_PIPELINE_STAGE_UPDATE_OWN','applicantS_PIPELINE_STAGE_UPDATE_ALL','applicantS_PIPELINE_STAGE_BULK_UPDATE','applicantS_IMPORT','applicantS_EXPORT','POSITIONS_VIEW','POSITIONS_VIEW_ALL','POSITIONS_CREATE','POSITIONS_EDIT_BASIC','POSITIONS_EDIT_DETAILED','POSITIONS_RECRUITER_ASSIGN','POSITIONS_DELETE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_VIEW','USERS_CREATE','USERS_EDIT','USERS_DELETE','USERS_PERMISSIONS_MANAGE','USER_GROUPS_VIEW','USER_GROUPS_CREATE','USER_GROUPS_EDIT','USER_GROUPS_DELETE','ROLES_MANAGE','SYSTEM_SETTINGS_VIEW','SYSTEM_SETTINGS_EDIT','WARNING_CONFIGURATIONS_VIEW','WARNING_CONFIGURATIONS_MANAGE','RECRUITMENT_STAGES_VIEW','RECRUITMENT_STAGES_EDIT','CUSTOM_FIELDS_VIEW','CUSTOM_FIELDS_EDIT','WEBHOOKS_VIEW','WEBHOOKS_EDIT','AI_INTEGRATION_VIEW','AI_INTEGRATION_EDIT','UPLOAD_QUEUE_VIEW','UPLOAD_QUEUE_MANAGE','BULK_UPLOAD_EXECUTE','DASHBOARD_VIEW','REPORTS_GENERATE','WEBHOOK_ANALYTICS_VIEW','LOGS_VIEW','LOGS_EXPORT','APP_PERFORMANCE_VIEW','TASK_BOARD_VIEW','TASK_BOARD_MANAGE_OWN','TASK_BOARD_MANAGE_ALL','JOB_MATCH_VIEW','JOB_MATCH_MANAGE','USER_PREFERENCES_MANAGE_OWN','USER_PREFERENCES_MANAGE_ALL','EVALUATION_LINKS_VIEW','EVALUATION_LINKS_CREATE_OWN','EVALUATION_LINKS_CREATE_ALL','EVALUATION_LINKS_MANAGE_OWN','EVALUATION_LINKS_MANAGE_ALL'], true, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Recruiter', 'Can manage applicants and positions', ARRAY['applicantS_VIEW','applicantS_VIEW_DETAILED','applicantS_CREATE','applicantS_EDIT_BASIC','applicantS_EDIT_BASIC_OWN','applicantS_EDIT_BASIC_ALL','applicantS_EDIT_SENSITIVE_OWN','applicantS_EDIT_SENSITIVE_ALL','applicantS_SOURCE_ASSIGN','applicantS_RECRUITER_ASSIGN','applicantS_RECRUITER_ASSIGN_OWN','applicantS_RECRUITER_ASSIGN_ALL','applicantS_PIPELINE_STAGE_UPDATE','applicantS_PIPELINE_STAGE_UPDATE_OWN','applicantS_PIPELINE_STAGE_UPDATE_ALL','applicantS_RESUMES_UPLOAD','applicantS_RESUMES_UPLOAD_OWN','applicantS_RESUMES_UPLOAD_ALL','applicantS_COMMENTS_VIEW','applicantS_COMMENTS_ADD','applicantS_COMMENTS_ADD_OWN','applicantS_COMMENTS_ADD_ALL','applicantS_IMPORT','applicantS_EXPORT','applicantS_ACTIVITIES_VIEW','POSITIONS_VIEW','POSITIONS_CREATE','POSITIONS_EDIT_BASIC','POSITIONS_RECRUITER_ASSIGN','POSITIONS_IMPORT','POSITIONS_EXPORT','TASK_BOARD_VIEW','TASK_BOARD_MANAGE_OWN','RECRUITMENT_STAGES_VIEW','USER_PREFERENCES_MANAGE_OWN','BULK_UPLOAD_EXECUTE','DASHBOARD_VIEW','REPORTS_GENERATE'], true, false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Hiring Manager', 'Can view applicants and positions', ARRAY['applicantS_VIEW','applicantS_VIEW_DETAILED','applicantS_COMMENTS_VIEW','POSITIONS_VIEW','TASK_BOARD_VIEW','DASHBOARD_VIEW','USER_PREFERENCES_MANAGE_OWN'], true, false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Pre-Registered User', 'Minimal permissions for pre-registered AD users - login and view own profile only', ARRAY['USER_PREFERENCES_MANAGE_OWN','ROLES_MANAGE'], false, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Employee', 'Employee self-service access', ARRAY['USER_PREFERENCES_MANAGE_OWN'], false, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign admin user to Admin group
UPDATE "User"
SET "userGroupId" = '00000000-0000-0000-0000-000000000001',
    "updatedAt" = NOW()
WHERE email = 'admin@example.com'
  AND ("userGroupId" IS NULL OR "userGroupId" <> '00000000-0000-0000-0000-000000000001');

 
