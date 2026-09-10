CREATE TABLE IF NOT EXISTS "service_desk_categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "service_desk_categories_key_check"
    CHECK ("key" ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  CONSTRAINT "service_desk_categories_label_check"
    CHECK (char_length(trim("label")) BETWEEN 1 AND 80)
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_desk_categories_company_key_uq"
  ON "service_desk_categories" (
    COALESCE("company_id", '00000000-0000-0000-0000-000000000000'::uuid),
    "key"
  );
CREATE INDEX IF NOT EXISTS "service_desk_categories_company_order_idx"
  ON "service_desk_categories"("company_id", "sort_order");

CREATE TABLE IF NOT EXISTS "service_desk_category_assignees" (
  "category_id" UUID NOT NULL REFERENCES "service_desk_categories"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("category_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "service_desk_category_assignees_user_idx"
  ON "service_desk_category_assignees"("user_id", "category_id");

ALTER TABLE "employee_support_requests"
  DROP CONSTRAINT IF EXISTS "employee_support_requests_category_check";
