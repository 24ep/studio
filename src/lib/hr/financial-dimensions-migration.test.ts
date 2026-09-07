import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const legacyMigrationPath = resolve(
  process.cwd(),
  'prisma/migrations-legacy/20260801170000_canonical_cost_centers_projects/migration.sql',
);
const preservationMigrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260815073000_restore_business_constraints/migration.sql',
);

describe('canonical financial dimensions migration', () => {
  const sql = readFileSync(legacyMigrationPath, 'utf8');
  const preservationSql = readFileSync(preservationMigrationPath, 'utf8');

  it('creates company-scoped cost center and project registries', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS hr_cost_centers');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS hr_projects');
    expect(sql).toContain('hr_cost_centers_company_code_uq');
    expect(sql).toContain('hr_projects_company_code_uq');
    expect(sql).toContain("status IN ('draft', 'active', 'on_hold', 'closed', 'archived')");
  });

  it('adds canonical references without removing legacy text values', () => {
    for (const table of [
      'hr_overtime_requests',
      'hr_timesheet_entries',
      'expense_claims',
      'expense_claim_items',
      'employee_advances',
      'travel_requests',
      'hr_payroll_inputs',
      'hr_payroll_accounting_lines',
    ]) {
      expect(sql).toContain(`ALTER TABLE ${table}`);
    }
    expect(sql).not.toMatch(/DROP COLUMN/i);
  });

  it('protects historical references and preserves non-Prisma constraints after baselining', () => {
    expect(sql).toContain('REFERENCES hr_cost_centers(id) ON DELETE RESTRICT');
    expect(sql).toContain('REFERENCES hr_projects(id) ON DELETE RESTRICT');
    expect(sql).toContain('effective_to IS NULL OR effective_to >= effective_from');
    expect(preservationSql).toContain('hr_cost_centers_dates_ck');
    expect(preservationSql).toContain('hr_projects_status_ck');
    expect(preservationSql).toContain('hr_cost_centers_company_code_uq');
    expect(preservationSql).toContain('hr_projects_company_code_uq');
  });
});
