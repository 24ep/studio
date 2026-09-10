CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hr_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, code TEXT NOT NULL, name TEXT NOT NULL,
  description TEXT, owner_employee_id UUID, parent_id UUID, effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE, is_active BOOLEAN NOT NULL DEFAULT TRUE, version INTEGER NOT NULL DEFAULT 1,
  created_by_id UUID, updated_by_id UUID, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hr_cost_centers_dates_ck CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT hr_cost_centers_parent_fk FOREIGN KEY (parent_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX hr_cost_centers_company_code_uq ON hr_cost_centers(COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(code));

CREATE TABLE IF NOT EXISTS hr_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, code TEXT NOT NULL, name TEXT NOT NULL,
  description TEXT, cost_center_id UUID, owner_employee_id UUID, status TEXT NOT NULL DEFAULT 'active',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE, effective_to DATE, billable BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, version INTEGER NOT NULL DEFAULT 1, created_by_id UUID,
  updated_by_id UUID, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hr_projects_status_ck CHECK (status IN ('draft', 'active', 'on_hold', 'closed', 'archived')),
  CONSTRAINT hr_projects_dates_ck CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT hr_projects_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX hr_projects_company_code_uq ON hr_projects(COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(code));

ALTER TABLE hr_overtime_requests ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE hr_timesheet_entries ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE expense_claims ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE expense_claim_items ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE employee_advances ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE travel_requests ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE hr_payroll_inputs ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;
ALTER TABLE hr_payroll_accounting_lines ADD COLUMN cost_center_id UUID, ADD COLUMN project_id UUID;

-- Each canonical reference is restrictive so historical financial evidence cannot be orphaned.
ALTER TABLE hr_overtime_requests ADD CONSTRAINT hr_overtime_requests_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT hr_overtime_requests_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE hr_timesheet_entries ADD CONSTRAINT hr_timesheet_entries_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT hr_timesheet_entries_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE expense_claims ADD CONSTRAINT expense_claims_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT expense_claims_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE expense_claim_items ADD CONSTRAINT expense_claim_items_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT expense_claim_items_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE employee_advances ADD CONSTRAINT employee_advances_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT employee_advances_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE travel_requests ADD CONSTRAINT travel_requests_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT travel_requests_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE hr_payroll_inputs ADD CONSTRAINT hr_payroll_inputs_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT hr_payroll_inputs_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
ALTER TABLE hr_payroll_accounting_lines ADD CONSTRAINT hr_payroll_accounting_lines_cost_center_fk FOREIGN KEY (cost_center_id) REFERENCES hr_cost_centers(id) ON DELETE RESTRICT, ADD CONSTRAINT hr_payroll_accounting_lines_project_fk FOREIGN KEY (project_id) REFERENCES hr_projects(id) ON DELETE RESTRICT;
