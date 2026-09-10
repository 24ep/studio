ALTER TABLE "hr_employees" ADD COLUMN "applicant_id" UUID;

CREATE UNIQUE INDEX "hr_employees_applicant_id_key"
  ON "hr_employees"("applicant_id") WHERE "applicant_id" IS NOT NULL;

ALTER TABLE "hr_employees"
  ADD CONSTRAINT "hr_employees_applicant_id_fkey"
  FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
