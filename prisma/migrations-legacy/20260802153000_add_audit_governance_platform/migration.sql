CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "audit_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sequence" BIGSERIAL NOT NULL UNIQUE,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "level" VARCHAR(20) NOT NULL DEFAULT 'AUDIT',
  "action" VARCHAR(160) NOT NULL,
  "outcome" VARCHAR(32) NOT NULL DEFAULT 'success',
  "message" TEXT NOT NULL,
  "source" VARCHAR(200),
  "actor_user_id" UUID,
  "impersonator_id" UUID,
  "company_id" UUID,
  "entity_type" VARCHAR(120),
  "entity_id" VARCHAR(200),
  "request_id" VARCHAR(160),
  "correlation_id" VARCHAR(160),
  "ip_address" INET,
  "user_agent" VARCHAR(1000),
  "reason" TEXT,
  "before_value" JSONB,
  "after_value" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "previous_hash" VARCHAR(64),
  "event_hash" VARCHAR(64) NOT NULL UNIQUE,
  "schema_version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "audit_events_level_check" CHECK ("level" IN ('INFO','WARN','ERROR','AUDIT')),
  CONSTRAINT "audit_events_outcome_check" CHECK ("outcome" IN ('success','failure','denied','partial','unknown'))
);

CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at" DESC);
CREATE INDEX "audit_events_actor_occurred_idx" ON "audit_events"("actor_user_id", "occurred_at" DESC);
CREATE INDEX "audit_events_company_occurred_idx" ON "audit_events"("company_id", "occurred_at" DESC);
CREATE INDEX "audit_events_entity_idx" ON "audit_events"("entity_type", "entity_id");
CREATE INDEX "audit_events_action_outcome_idx" ON "audit_events"("action", "outcome");

CREATE OR REPLACE FUNCTION reject_audit_record_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_events_immutable"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION reject_audit_record_mutation();

CREATE TABLE "audit_event_dead_letters" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "payload" JSONB NOT NULL,
  "error" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
  "next_attempt_at" TIMESTAMPTZ,
  "resolved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_event_dead_letters_retry_idx" ON "audit_event_dead_letters"("status", "next_attempt_at");

CREATE TABLE "audit_archive_outbox" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL UNIQUE REFERENCES "audit_events"("id") ON DELETE RESTRICT,
  "payload" JSONB NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ,
  "last_error" TEXT,
  "receipt" JSONB,
  "delivered_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_archive_outbox_status_check" CHECK ("status" IN ('pending','delivering','delivered','failed'))
);
CREATE INDEX "audit_archive_outbox_status_idx" ON "audit_archive_outbox"("status", "next_attempt_at");

CREATE TABLE "audit_legal_holds" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID,
  "name" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "scope" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" VARCHAR(32) NOT NULL DEFAULT 'active',
  "starts_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ends_at" TIMESTAMPTZ,
  "created_by_id" UUID NOT NULL,
  "released_by_id" UUID,
  "released_at" TIMESTAMPTZ,
  "release_reason" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_legal_holds_status_check" CHECK ("status" IN ('active','released','expired'))
);
CREATE INDEX "audit_legal_holds_company_status_idx" ON "audit_legal_holds"("company_id", "status");

CREATE TABLE "audit_retention_executions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "policy_id" UUID,
  "company_id" UUID,
  "record_type" TEXT NOT NULL,
  "mode" VARCHAR(32) NOT NULL DEFAULT 'dry_run',
  "status" VARCHAR(32) NOT NULL DEFAULT 'queued',
  "cutoff_at" TIMESTAMPTZ NOT NULL,
  "candidate_count" INTEGER NOT NULL DEFAULT 0,
  "processed_count" INTEGER NOT NULL DEFAULT 0,
  "held_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "requested_by_id" UUID NOT NULL,
  "approved_by_id" UUID,
  "approved_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "report" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "receipt_hash" VARCHAR(64),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_retention_mode_check" CHECK ("mode" IN ('dry_run','execute')),
  CONSTRAINT "audit_retention_status_check" CHECK ("status" IN ('queued','awaiting_approval','running','completed','failed','cancelled'))
);
CREATE INDEX "audit_retention_executions_status_idx" ON "audit_retention_executions"("status", "created_at" DESC);
CREATE INDEX "audit_retention_executions_company_record_idx" ON "audit_retention_executions"("company_id", "record_type");

CREATE TABLE "audit_retention_execution_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "execution_id" UUID NOT NULL REFERENCES "audit_retention_executions"("id") ON DELETE CASCADE,
  "entity_id" VARCHAR(200) NOT NULL,
  "storage_keys" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "processed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_retention_execution_item_unique" UNIQUE ("execution_id", "entity_id"),
  CONSTRAINT "audit_retention_execution_item_status_check" CHECK ("status" IN ('pending','held','deleted','anonymized','failed'))
);
CREATE INDEX "audit_retention_execution_items_status_idx" ON "audit_retention_execution_items"("execution_id", "status");

CREATE TABLE "audit_access_review_campaigns" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID,
  "name" TEXT NOT NULL,
  "scope" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
  "due_at" TIMESTAMPTZ NOT NULL,
  "owner_user_id" UUID NOT NULL,
  "launched_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "certification_hash" VARCHAR(64),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_access_campaign_status_check" CHECK ("status" IN ('draft','active','completed','cancelled'))
);
CREATE INDEX "audit_access_campaigns_company_status_idx" ON "audit_access_review_campaigns"("company_id", "status", "due_at");

CREATE TABLE "audit_access_review_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" UUID NOT NULL REFERENCES "audit_access_review_campaigns"("id") ON DELETE CASCADE,
  "subject_user_id" UUID NOT NULL,
  "reviewer_user_id" UUID,
  "access_snapshot" JSONB NOT NULL,
  "risk_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "decision" VARCHAR(32) NOT NULL DEFAULT 'pending',
  "justification" TEXT,
  "remediation" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "decided_at" TIMESTAMPTZ,
  "remediated_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_access_review_item_unique" UNIQUE ("campaign_id", "subject_user_id"),
  CONSTRAINT "audit_access_review_decision_check" CHECK ("decision" IN ('pending','approve','revoke','modify','exception'))
);
CREATE INDEX "audit_access_review_items_reviewer_idx" ON "audit_access_review_items"("reviewer_user_id", "decision");

CREATE TABLE "audit_sod_rules" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(80) NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "permission_a" VARCHAR(160) NOT NULL,
  "permission_b" VARCHAR(160) NOT NULL,
  "severity" VARCHAR(20) NOT NULL DEFAULT 'high',
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "requires_mitigation" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "audit_controls" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(80) NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "framework_refs" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "frequency" VARCHAR(40) NOT NULL,
  "owner_user_id" UUID,
  "reviewer_user_id" UUID,
  "automation_key" VARCHAR(120),
  "status" VARCHAR(32) NOT NULL DEFAULT 'active',
  "next_due_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_controls_status_due_idx" ON "audit_controls"("status", "next_due_at");

CREATE TABLE "audit_periods" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "framework" VARCHAR(80) NOT NULL,
  "company_id" UUID,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'open',
  "locked_at" TIMESTAMPTZ,
  "locked_by_id" UUID,
  "manifest_hash" VARCHAR(64),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_period_dates_check" CHECK ("ends_at" >= "starts_at"),
  CONSTRAINT "audit_period_status_check" CHECK ("status" IN ('open','fieldwork','locked','archived'))
);
CREATE INDEX "audit_periods_company_status_idx" ON "audit_periods"("company_id", "status");

CREATE TABLE "audit_evidence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "control_id" UUID NOT NULL REFERENCES "audit_controls"("id") ON DELETE RESTRICT,
  "period_id" UUID REFERENCES "audit_periods"("id") ON DELETE RESTRICT,
  "company_id" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "evidence_type" VARCHAR(60) NOT NULL,
  "source" TEXT,
  "storage_key" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "checksum" VARCHAR(64) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "collected_by_id" UUID,
  "collected_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_evidence_control_collected_idx" ON "audit_evidence"("control_id", "collected_at" DESC);
CREATE INDEX "audit_evidence_period_idx" ON "audit_evidence"("period_id");
CREATE INDEX "audit_evidence_company_collected_idx" ON "audit_evidence"("company_id", "collected_at" DESC);

CREATE OR REPLACE FUNCTION reject_locked_period_evidence_mutation() RETURNS trigger AS $$
DECLARE audit_period_status TEXT;
BEGIN
  SELECT status INTO audit_period_status FROM audit_periods WHERE id = COALESCE(OLD.period_id, NEW.period_id);
  IF audit_period_status IN ('locked','archived') THEN
    RAISE EXCEPTION 'evidence in a locked audit period is immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_evidence_locked_period_guard"
BEFORE UPDATE OR DELETE ON "audit_evidence"
FOR EACH ROW EXECUTE FUNCTION reject_locked_period_evidence_mutation();

CREATE TABLE "audit_exceptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "control_id" UUID REFERENCES "audit_controls"("id") ON DELETE SET NULL,
  "detector_key" VARCHAR(120),
  "fingerprint" VARCHAR(64) NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" VARCHAR(20) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'open',
  "company_id" UUID,
  "owner_user_id" UUID,
  "due_at" TIMESTAMPTZ,
  "evidence" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "remediation" TEXT,
  "reviewer_user_id" UUID,
  "closed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_exception_severity_check" CHECK ("severity" IN ('critical','high','medium','low')),
  CONSTRAINT "audit_exception_status_check" CHECK ("status" IN ('open','investigating','remediated','accepted','closed'))
);
CREATE INDEX "audit_exceptions_status_severity_idx" ON "audit_exceptions"("status", "severity", "due_at");

CREATE TABLE "audit_assurance_evidence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" VARCHAR(60) NOT NULL,
  "reference" TEXT NOT NULL,
  "status" VARCHAR(32) NOT NULL,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "owner_user_id" UUID,
  "approver_user_id" UUID,
  "company_id" UUID,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "checksum" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_assurance_evidence_kind_idx" ON "audit_assurance_evidence"("kind", "occurred_at" DESC);
CREATE INDEX "audit_assurance_evidence_company_kind_idx" ON "audit_assurance_evidence"("company_id", "kind", "occurred_at" DESC);

INSERT INTO "audit_sod_rules" ("code", "name", "description", "permission_a", "permission_b", "severity") VALUES
  ('PAYROLL_PREPARE_APPROVE', 'Payroll preparation and approval', 'A user must not both prepare and finally approve payroll.', 'HR_PAYROLL_MANAGE', 'HR_PAYROLL_APPROVE', 'critical'),
  ('EXPENSE_SUBMIT_APPROVE', 'Expense submission and approval', 'A user must not approve expenses they can submit on behalf of others.', 'HR_EXPENSES_MANAGE', 'HR_EXPENSES_APPROVE', 'high'),
  ('ACCESS_ADMIN_REVIEW', 'Access administration and certification', 'Access administrators require an independent access reviewer.', 'USERS_PERMISSIONS_MANAGE', 'AUDIT_ACCESS_REVIEW_MANAGE', 'high'),
  ('AUDIT_WRITE_ADMIN', 'Audit evidence administration', 'Audit evidence contributors must not lock their own audit period.', 'AUDIT_EVIDENCE_MANAGE', 'AUDIT_PERIOD_LOCK', 'critical')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "audit_controls" ("code", "title", "description", "category", "framework_refs", "frequency", "automation_key") VALUES
  ('AUD-01', 'Immutable audit trail', 'Security and business-critical events are complete, chained, and append-only.', 'Security', '["ISO27001:A.8.15","SOC2:CC7.2"]', 'continuous', 'audit_chain_integrity'),
  ('IAM-01', 'Periodic access certification', 'Privileged and business access is independently reviewed and remediated.', 'Access', '["ISO27001:A.5.18","SOC2:CC6.3"]', 'quarterly', 'access_review_overdue'),
  ('PRV-01', 'Retention and legal hold', 'Personal data is retained and disposed according to policy unless held.', 'Privacy', '["PDPA:Retention","ISO27001:A.8.10"]', 'daily', 'retention_execution'),
  ('OPS-01', 'Backup restoration', 'Backups are encrypted, monitored, and periodically restored.', 'Resilience', '["ISO27001:A.8.13","SOC2:A1.2"]', 'quarterly', 'recovery_test_overdue'),
  ('CHG-01', 'Authorized production change', 'Production changes are reviewed, tested, approved, and traceable.', 'Change management', '["ISO27001:A.8.32","SOC2:CC8.1"]', 'per_change', 'change_evidence')
ON CONFLICT ("code") DO NOTHING;
