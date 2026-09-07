ALTER TABLE "hr_onboarding_tasks"
  ADD COLUMN IF NOT EXISTS "detailed_instructions" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS "is_required" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "employee_visibility" TEXT NOT NULL DEFAULT 'visible';

ALTER TABLE "hr_onboarding_tasks"
  ADD CONSTRAINT "hr_onboarding_tasks_employee_visibility_check"
  CHECK ("employee_visibility" IN ('visible', 'after_assigned', 'hidden'));
