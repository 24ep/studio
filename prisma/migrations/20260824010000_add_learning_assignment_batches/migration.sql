CREATE TABLE IF NOT EXISTS "hr_learning_assignment_batches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "course_ids" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "source_type" VARCHAR(32) NOT NULL,
  "source_id" UUID,
  "source_label" TEXT NOT NULL,
  "due_date" DATE,
  "assigned_by_user_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(200) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "hr_learning_assignment_batches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_learning_assignment_batches_idempotency_key_key" UNIQUE ("idempotency_key"),
  CONSTRAINT "hr_learning_assignment_batches_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "hr_learning_assignment_batches_employee_created_idx"
  ON "hr_learning_assignment_batches"("employee_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "hr_learning_assignment_batches_source_idx"
  ON "hr_learning_assignment_batches"("source_type", "source_id");
