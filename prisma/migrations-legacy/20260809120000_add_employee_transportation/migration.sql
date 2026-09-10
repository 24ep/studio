CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hr_transportation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  mode TEXT NOT NULL,
  route TEXT NOT NULL,
  pickup_point TEXT,
  pickup_time TIME,
  vehicle TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by_id UUID,
  updated_by_id UUID,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hr_transportation_employee_fk FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE RESTRICT,
  CONSTRAINT hr_transportation_mode_ck CHECK (mode IN ('company_bus', 'van', 'car_allowance', 'shuttle')),
  CONSTRAINT hr_transportation_status_ck CHECK (status IN ('active', 'paused'))
);

CREATE UNIQUE INDEX IF NOT EXISTS hr_transportation_employee_uq ON hr_transportation_assignments(employee_id);
CREATE INDEX IF NOT EXISTS hr_transportation_status_idx ON hr_transportation_assignments(status);
CREATE INDEX IF NOT EXISTS hr_transportation_route_idx ON hr_transportation_assignments(lower(route));
