CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "person_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "preferred_name" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "location" TEXT,
  "introduction" TEXT,
  "avatar_url" TEXT,
  "education" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "work_experience" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "skills" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "custom_attributes" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "person_profiles_email_idx" ON "person_profiles"("email");
CREATE INDEX "person_profiles_last_name_first_name_idx" ON "person_profiles"("last_name", "first_name");

ALTER TABLE "Applicant" ADD COLUMN "person_profile_id" UUID;
ALTER TABLE "hr_employees" ADD COLUMN "person_profile_id" UUID;

INSERT INTO "person_profiles" ("id", "first_name", "last_name", "email", "phone", "avatar_url", "education", "work_experience", "custom_attributes")
SELECT gen_random_uuid(),
  COALESCE(NULLIF(split_part(trim(applicant."name"), ' ', 1), ''), 'Unknown'),
  COALESCE(NULLIF(substr(trim(applicant."name"), length(split_part(trim(applicant."name"), ' ', 1)) + 2), ''), '-'),
  applicant."email", applicant."phone", applicant."avatarUrl",
  COALESCE(applicant."educationData", '[]'::jsonb), COALESCE(applicant."experienceData", '[]'::jsonb),
  COALESCE(applicant."customAttributes", '{}'::jsonb)
FROM "Applicant" applicant;

UPDATE "Applicant" applicant SET "person_profile_id" = profile."id"
FROM "person_profiles" profile
WHERE profile."email" = applicant."email" AND applicant."person_profile_id" IS NULL;

UPDATE "hr_employees" employee
SET "person_profile_id" = applicant."person_profile_id"
FROM "Applicant" applicant
WHERE employee."applicant_id" = applicant."id" AND employee."person_profile_id" IS NULL;

CREATE UNIQUE INDEX "hr_employees_person_profile_id_key" ON "hr_employees"("person_profile_id") WHERE "person_profile_id" IS NOT NULL;
CREATE INDEX "Applicant_person_profile_id_idx" ON "Applicant"("person_profile_id");
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_person_profile_id_fkey" FOREIGN KEY ("person_profile_id") REFERENCES "person_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_person_profile_id_fkey" FOREIGN KEY ("person_profile_id") REFERENCES "person_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION initialize_applicant_person_profile() RETURNS trigger AS $$
DECLARE profile_id UUID;
BEGIN
  IF NEW."person_profile_id" IS NULL THEN
    profile_id := gen_random_uuid();
    INSERT INTO "person_profiles" ("id", "first_name", "last_name", "email", "phone", "avatar_url", "education", "work_experience", "custom_attributes")
    VALUES (profile_id,
      COALESCE(NULLIF(split_part(trim(NEW."name"), ' ', 1), ''), 'Unknown'),
      COALESCE(NULLIF(substr(trim(NEW."name"), length(split_part(trim(NEW."name"), ' ', 1)) + 2), ''), '-'),
      NEW."email", NEW."phone", NEW."avatarUrl", COALESCE(NEW."educationData", '[]'::jsonb),
      COALESCE(NEW."experienceData", '[]'::jsonb), COALESCE(NEW."customAttributes", '{}'::jsonb));
    NEW."person_profile_id" := profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "Applicant_initialize_person_profile" BEFORE INSERT ON "Applicant"
FOR EACH ROW EXECUTE FUNCTION initialize_applicant_person_profile();

CREATE OR REPLACE FUNCTION link_employee_person_profile() RETURNS trigger AS $$
DECLARE linked_profile UUID;
BEGIN
  IF NEW."person_profile_id" IS NULL AND NEW."applicant_id" IS NOT NULL THEN
    SELECT applicant."person_profile_id" INTO linked_profile FROM "Applicant" applicant WHERE applicant."id" = NEW."applicant_id";
    NEW."person_profile_id" := linked_profile;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "hr_employees_link_person_profile" BEFORE INSERT OR UPDATE OF "applicant_id" ON "hr_employees"
FOR EACH ROW EXECUTE FUNCTION link_employee_person_profile();

-- Hiring links resolve the person record with this invariant:
-- SET "person_profile_id" = applicant."person_profile_id"
