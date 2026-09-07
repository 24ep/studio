ALTER TABLE "hr_shift_requests"
  ADD COLUMN IF NOT EXISTS "open_shift_id" UUID;

CREATE INDEX IF NOT EXISTS "hr_shift_requests_open_shift_id_idx"
  ON "hr_shift_requests"("open_shift_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'hr_shift_requests_open_shift_id_fkey'
  ) THEN
    ALTER TABLE "hr_shift_requests"
      ADD CONSTRAINT "hr_shift_requests_open_shift_id_fkey"
      FOREIGN KEY ("open_shift_id") REFERENCES "hr_open_shifts"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
