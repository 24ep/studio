UPDATE "RecruitmentStage"
SET is_system = false
WHERE name IN (
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewing',
  'Offer Extended',
  'Offer Accepted',
  'On Hold'
)
AND is_system = true;

INSERT INTO "RecruitmentStage" (
  id, name, description, is_system, sort_order, color_complete, color_badge
) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Applied', 'Applicant has submitted their application', true, 1, '#60a5fa', '#60a5fa'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Hired', 'Applicant has been hired and started employment', true, 8, '#22c55e', '#22c55e'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Rejected', 'Applicant has been rejected from the process', true, 9, '#ef4444', '#ef4444')
ON CONFLICT (name) DO UPDATE SET
  is_system = true;
