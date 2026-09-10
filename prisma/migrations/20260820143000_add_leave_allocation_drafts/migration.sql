CREATE TABLE IF NOT EXISTS "hr_leave_allocation_drafts" (
  "user_id" UUID PRIMARY KEY,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "hr_leave_allocation_drafts_updated_at_idx"
  ON "hr_leave_allocation_drafts" ("updated_at" DESC);

COMMENT ON TABLE "hr_leave_allocation_drafts" IS
  'Server-backed per-user working drafts for the Leave allocation guided flow.';
