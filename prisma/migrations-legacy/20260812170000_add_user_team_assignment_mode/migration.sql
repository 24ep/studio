ALTER TABLE "UserTeam"
  ADD COLUMN IF NOT EXISTS "assignment_mode" VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "assignment_conditions" JSONB NOT NULL DEFAULT '{}'::jsonb;
