-- Preserve trigger-based invariants from the pre-baseline migration history.
-- Prisma does not represent trigger functions in schema.prisma, so they must be
-- restored explicitly after the squashed baseline on fresh databases. The
-- DROP/CREATE trigger sequence is also safe for upgraded databases where the
-- historical trigger already exists.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION initialize_applicant_person_profile() RETURNS trigger AS $$
DECLARE profile_id UUID;
BEGIN
  IF NEW."person_profile_id" IS NULL THEN
    profile_id := gen_random_uuid();
    INSERT INTO "person_profiles" (
      "id", "first_name", "last_name", "email", "phone", "avatar_url",
      "education", "work_experience", "custom_attributes"
    )
    VALUES (
      profile_id,
      COALESCE(NULLIF(split_part(trim(NEW."name"), ' ', 1), ''), 'Unknown'),
      COALESCE(NULLIF(substr(trim(NEW."name"), length(split_part(trim(NEW."name"), ' ', 1)) + 2), ''), '-'),
      NEW."email",
      NEW."phone",
      NEW."avatarUrl",
      COALESCE(NEW."educationData", '[]'::jsonb),
      COALESCE(NEW."experienceData", '[]'::jsonb),
      COALESCE(NEW."customAttributes", '{}'::jsonb)
    );
    NEW."person_profile_id" := profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Applicant_initialize_person_profile" ON "Applicant";
CREATE TRIGGER "Applicant_initialize_person_profile"
BEFORE INSERT ON "Applicant"
FOR EACH ROW EXECUTE FUNCTION initialize_applicant_person_profile();

CREATE OR REPLACE FUNCTION link_employee_person_profile() RETURNS trigger AS $$
DECLARE linked_profile UUID;
BEGIN
  IF NEW."person_profile_id" IS NULL AND NEW."applicant_id" IS NOT NULL THEN
    SELECT applicant."person_profile_id"
      INTO linked_profile
      FROM "Applicant" applicant
      WHERE applicant."id" = NEW."applicant_id";
    NEW."person_profile_id" := linked_profile;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "hr_employees_link_person_profile" ON "hr_employees";
CREATE TRIGGER "hr_employees_link_person_profile"
BEFORE INSERT OR UPDATE OF "applicant_id" ON "hr_employees"
FOR EACH ROW EXECUTE FUNCTION link_employee_person_profile();
