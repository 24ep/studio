ALTER TABLE "hr_certifications"
  ADD COLUMN IF NOT EXISTS "policy_metadata" JSONB NOT NULL DEFAULT '{}'::JSONB;
