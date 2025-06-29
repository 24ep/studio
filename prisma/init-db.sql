-- Initialize CandiTrack database with default data

-- Create default admin user (password: nccadmin)
INSERT INTO "User" (id, name, email, password, role, "modulePermissions", "authenticationMethod", "forcePasswordChange", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@ncc.com',
  '$2a$10$dwiCxbUtCqnXeB2O8BmiyeWHL0e7rOqahafQAUACsnD4EZ9nGqPx2',
  'Admin',
  ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'],
  'basic',
  false,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create default positions
INSERT INTO "Position" (id, title, department, description, "isOpen", "createdAt", "updatedAt")
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Software Engineer', 'Engineering', 'Develops and maintains software.', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Product Manager', 'Product', 'Oversees product development.', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create default recruitment stages
INSERT INTO "RecruitmentStage" (id, name, description, "isSystem", "sortOrder")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Applied', 'Candidate has submitted their application', true, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Screening', 'Initial screening of candidate qualifications', true, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Shortlisted', 'Candidate has been shortlisted for further consideration', true, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Interview Scheduled', 'Interview has been scheduled with the candidate', true, 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Interviewing', 'Candidate is currently in the interview process', true, 5),
  ('550e8400-e29b-41d4-a716-446655440006', 'Offer Extended', 'Job offer has been extended to the candidate', true, 6),
  ('550e8400-e29b-41d4-a716-446655440007', 'Offer Accepted', 'Candidate has accepted the job offer', true, 7),
  ('550e8400-e29b-41d4-a716-446655440008', 'Hired', 'Candidate has been hired and started employment', true, 8),
  ('550e8400-e29b-41d4-a716-446655440009', 'Rejected', 'Candidate has been rejected from the process', true, 9),
  ('550e8400-e29b-41d4-a716-446655440010', 'On Hold', 'Candidate application is temporarily on hold', true, 10)
ON CONFLICT (name) DO NOTHING;

-- Create default user groups
INSERT INTO "UserGroup" (id, name, description, permissions, "isDefault", "isSystemRole", "createdAt", "updatedAt")
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'], true, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Recruiter', 'Can manage candidates and positions', ARRAY['CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','RECRUITMENT_STAGES_MANAGE'], true, false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Hiring Manager', 'Can view candidates and positions', ARRAY['CANDIDATES_VIEW','POSITIONS_VIEW'], true, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign admin user to Admin group
INSERT INTO "User_UserGroup" ("userId", "groupId")
SELECT u.id, '00000000-0000-0000-0000-000000000001'
FROM "User" u
WHERE u.email = 'admin@ncc.com'
ON CONFLICT ("userId", "groupId") DO NOTHING;

-- Create notification channels
INSERT INTO "NotificationChannel" (id, "channelKey", label, "createdAt", "updatedAt")
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'email', 'Email', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'webhook', 'Webhook', NOW(), NOW())
ON CONFLICT ("channelKey") DO NOTHING;

-- Create notification events
INSERT INTO "NotificationEvent" (id, "eventKey", label, description, "createdAt", "updatedAt")
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'candidate_created', 'Candidate Created', 'Triggered when a new candidate is created.', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000002', 'position_filled', 'Position Filled', 'Triggered when a position is filled.', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000003', 'stage_changed', 'Stage Changed', 'Triggered when a candidate changes recruitment stage.', NOW(), NOW())
ON CONFLICT ("eventKey") DO NOTHING; 