CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "employee_support_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_number" TEXT NOT NULL UNIQUE,
  "requester_user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "employee_id" UUID,
  "company_id" UUID,
  "assigned_to_user_id" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "category" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "employee_support_requests_status_check"
    CHECK ("status" IN ('submitted', 'in_review', 'action_required', 'resolved', 'closed', 'withdrawn')),
  CONSTRAINT "employee_support_requests_priority_check"
    CHECK ("priority" IN ('low', 'normal', 'high', 'critical')),
  CONSTRAINT "employee_support_requests_category_check"
    CHECK ("category" IN ('account_access', 'payroll', 'leave', 'documents', 'recruitment', 'technical', 'accessibility', 'contact_administrator', 'general'))
);

CREATE TABLE IF NOT EXISTS "employee_support_activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id" UUID NOT NULL REFERENCES "employee_support_requests"("id") ON DELETE RESTRICT,
  "actor_user_id" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "message" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'requester',
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "employee_support_activities_action_check"
    CHECK ("action" IN ('submitted', 'reply', 'closed', 'withdrawn', 'status_changed', 'assigned')),
  CONSTRAINT "employee_support_activities_visibility_check"
    CHECK ("visibility" IN ('requester', 'internal'))
);

CREATE INDEX IF NOT EXISTS "support_assignee_status_idx"
  ON "employee_support_requests"("assigned_to_user_id", "status");
CREATE INDEX IF NOT EXISTS "support_company_status_idx"
  ON "employee_support_requests"("company_id", "status");
CREATE INDEX IF NOT EXISTS "support_company_updated_idx"
  ON "employee_support_requests"("company_id", "updated_at" DESC);
CREATE INDEX IF NOT EXISTS "support_requester_updated_idx"
  ON "employee_support_requests"("requester_user_id", "updated_at" DESC);
CREATE INDEX IF NOT EXISTS "support_activity_request_idx"
  ON "employee_support_activities"("request_id", "created_at");
