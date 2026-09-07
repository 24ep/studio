CREATE TABLE "screening_consents" (
  "id" UUID NOT NULL,
  "applicant_id" UUID,
  "employee_id" UUID,
  "notice_version" TEXT NOT NULL,
  "capture_source" TEXT NOT NULL,
  "consented_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "screening_consents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "screening_consents_one_subject_check" CHECK (("applicant_id" IS NOT NULL)::int + ("employee_id" IS NOT NULL)::int = 1)
);

CREATE TABLE "screening_cases" (
  "id" UUID NOT NULL,
  "applicant_id" UUID,
  "employee_id" UUID,
  "requested_by_id" UUID,
  "trigger_type" TEXT NOT NULL,
  "use_ai" BOOLEAN NOT NULL DEFAULT false,
  "ai_status" TEXT NOT NULL DEFAULT 'not_requested',
  "status" TEXT NOT NULL DEFAULT 'queued',
  "identity_snapshot" JSONB NOT NULL,
  "sources_checked" JSONB NOT NULL DEFAULT '[]',
  "idempotency_key" TEXT NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "query_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "error_code" TEXT,
  "error_message" TEXT,
  "consent_id" UUID,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "screening_cases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "screening_cases_one_subject_check" CHECK (("applicant_id" IS NOT NULL)::int + ("employee_id" IS NOT NULL)::int = 1)
);

CREATE TABLE "screening_findings" (
  "id" UUID NOT NULL,
  "case_id" UUID NOT NULL,
  "source_type" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "source_title" TEXT,
  "publisher" TEXT,
  "published_at" TIMESTAMP(3),
  "category" TEXT NOT NULL,
  "allegation_status" TEXT NOT NULL DEFAULT 'unverified',
  "identity_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "matching_signals" JSONB NOT NULL DEFAULT '[]',
  "review_status" TEXT NOT NULL DEFAULT 'pending',
  "reviewed_excerpt" TEXT,
  "ai_summary" TEXT,
  "ai_explanation" TEXT,
  "reviewed_by_id" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "screening_findings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "screening_cases_idempotency_key_key" ON "screening_cases"("idempotency_key");
CREATE INDEX "screening_cases_status_created_at_idx" ON "screening_cases"("status", "created_at");
CREATE INDEX "screening_cases_applicant_id_created_at_idx" ON "screening_cases"("applicant_id", "created_at");
CREATE INDEX "screening_cases_employee_id_created_at_idx" ON "screening_cases"("employee_id", "created_at");
CREATE UNIQUE INDEX "screening_findings_case_id_source_url_key" ON "screening_findings"("case_id", "source_url");
CREATE INDEX "screening_findings_review_status_created_at_idx" ON "screening_findings"("review_status", "created_at");
CREATE INDEX "screening_consents_applicant_id_consented_at_idx" ON "screening_consents"("applicant_id", "consented_at");
CREATE INDEX "screening_consents_employee_id_consented_at_idx" ON "screening_consents"("employee_id", "consented_at");

ALTER TABLE "screening_consents" ADD CONSTRAINT "screening_consents_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE;
ALTER TABLE "screening_consents" ADD CONSTRAINT "screening_consents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE;
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE;
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE;
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "screening_consents"("id") ON DELETE SET NULL;
ALTER TABLE "screening_findings" ADD CONSTRAINT "screening_findings_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "screening_cases"("id") ON DELETE CASCADE;
ALTER TABLE "screening_findings" ADD CONSTRAINT "screening_findings_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL;

INSERT INTO "SystemSetting" ("key", "value", "createdAt", "updatedAt") VALUES
 ('screeningEnabled','false',NOW(),NOW()),
 ('screeningAutoApplicantEnabled','false',NOW(),NOW()),
 ('screeningAiAllowed','false',NOW(),NOW()),
 ('screeningManualAiDefault','false',NOW(),NOW()),
 ('screeningAutomaticAiDefault','false',NOW(),NOW()),
 ('screeningEnabledSources','brave,gdelt,un,ofac,uk,thai_sec',NOW(),NOW()),
 ('screeningBraveApiKey','',NOW(),NOW()),
 ('screeningMaxQueries','5',NOW(),NOW()),
 ('screeningMaxResultsPerQuery','10',NOW(),NOW()),
 ('screeningMonthlyQueryLimit','1000',NOW(),NOW()),
 ('screeningRetentionDays','180',NOW(),NOW()),
 ('screeningIdentityThreshold','0.8',NOW(),NOW())
ON CONFLICT ("key") DO NOTHING;
