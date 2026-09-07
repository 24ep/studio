-- Restore business invariants that existed in historical SQL migrations but
-- cannot be represented by the Prisma datamodel (CHECK constraints, expression
-- indexes, and immutable-record triggers). Existing installations can contain
-- legacy rows written before these invariants existed, so CHECK constraints are
-- added NOT VALID: PostgreSQL enforces them for new/updated rows immediately
-- without rewriting or rejecting historical records during deployment.

CREATE OR REPLACE FUNCTION reject_audit_record_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit records are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "audit_events_immutable" ON "audit_events";
CREATE TRIGGER "audit_events_immutable"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION reject_audit_record_mutation();

CREATE OR REPLACE FUNCTION reject_locked_period_evidence_mutation() RETURNS trigger AS $$
DECLARE audit_period_status TEXT;
BEGIN
  SELECT status INTO audit_period_status
  FROM audit_periods
  WHERE id = COALESCE(OLD.period_id, NEW.period_id);

  IF audit_period_status IN ('locked', 'archived') THEN
    RAISE EXCEPTION 'evidence in a locked audit period is immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "audit_evidence_locked_period_guard" ON "audit_evidence";
CREATE TRIGGER "audit_evidence_locked_period_guard"
BEFORE UPDATE OR DELETE ON "audit_evidence"
FOR EACH ROW EXECUTE FUNCTION reject_locked_period_evidence_mutation();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_events_level_check') THEN
    ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_level_check"
      CHECK ("level" IN ('INFO','WARN','ERROR','AUDIT')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_events_outcome_check') THEN
    ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_outcome_check"
      CHECK ("outcome" IN ('success','failure','denied','partial','unknown')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_archive_outbox_status_check') THEN
    ALTER TABLE "audit_archive_outbox" ADD CONSTRAINT "audit_archive_outbox_status_check"
      CHECK ("status" IN ('pending','delivering','delivered','failed')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_legal_holds_status_check') THEN
    ALTER TABLE "audit_legal_holds" ADD CONSTRAINT "audit_legal_holds_status_check"
      CHECK ("status" IN ('active','released','expired')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_retention_mode_check') THEN
    ALTER TABLE "audit_retention_executions" ADD CONSTRAINT "audit_retention_mode_check"
      CHECK ("mode" IN ('dry_run','execute')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_retention_status_check') THEN
    ALTER TABLE "audit_retention_executions" ADD CONSTRAINT "audit_retention_status_check"
      CHECK ("status" IN ('queued','awaiting_approval','running','completed','failed','cancelled')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_retention_execution_item_status_check') THEN
    ALTER TABLE "audit_retention_execution_items" ADD CONSTRAINT "audit_retention_execution_item_status_check"
      CHECK ("status" IN ('pending','held','deleted','anonymized','failed')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_access_campaign_status_check') THEN
    ALTER TABLE "audit_access_review_campaigns" ADD CONSTRAINT "audit_access_campaign_status_check"
      CHECK ("status" IN ('draft','active','completed','cancelled')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_access_review_decision_check') THEN
    ALTER TABLE "audit_access_review_items" ADD CONSTRAINT "audit_access_review_decision_check"
      CHECK ("decision" IN ('pending','approve','revoke','modify','exception')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_period_dates_check') THEN
    ALTER TABLE "audit_periods" ADD CONSTRAINT "audit_period_dates_check"
      CHECK ("ends_at" >= "starts_at") NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_period_status_check') THEN
    ALTER TABLE "audit_periods" ADD CONSTRAINT "audit_period_status_check"
      CHECK ("status" IN ('open','fieldwork','locked','archived')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_exception_severity_check') THEN
    ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exception_severity_check"
      CHECK ("severity" IN ('critical','high','medium','low')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_exception_status_check') THEN
    ALTER TABLE "audit_exceptions" ADD CONSTRAINT "audit_exception_status_check"
      CHECK ("status" IN ('open','investigating','remediated','accepted','closed')) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_cost_centers_dates_ck') THEN
    ALTER TABLE hr_cost_centers ADD CONSTRAINT hr_cost_centers_dates_ck
      CHECK (effective_to IS NULL OR effective_to >= effective_from) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_projects_status_ck') THEN
    ALTER TABLE hr_projects ADD CONSTRAINT hr_projects_status_ck
      CHECK (status IN ('draft', 'active', 'on_hold', 'closed', 'archived')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_projects_dates_ck') THEN
    ALTER TABLE hr_projects ADD CONSTRAINT hr_projects_dates_ck
      CHECK (effective_to IS NULL OR effective_to >= effective_from) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS hr_cost_centers_company_code_uq
  ON hr_cost_centers(
    COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(code)
  );

CREATE UNIQUE INDEX IF NOT EXISTS hr_projects_company_code_uq
  ON hr_projects(
    COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(code)
  );
