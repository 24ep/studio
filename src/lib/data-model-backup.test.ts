import { describe, expect, it, vi } from 'vitest';

import { createBusinessTransferPackage, DATA_MODEL_BACKUP_FORMAT, getDataModelTables, getDataTransferDomain, parseBusinessTransferPackage, parseDataModelBackup } from './data-model-backup';

describe('all data model backup contract', () => {
  it('derives broad model coverage from the generated Prisma schema', () => {
    const tables = getDataModelTables();
    expect(tables.length).toBeGreaterThan(150);
    expect(tables).toContainEqual(expect.objectContaining({ model: 'Applicant', table: 'Applicant', domain: 'recruiting' }));
    expect(tables).toContainEqual(expect.objectContaining({ model: 'Employee', table: 'hr_employees', domain: 'people' }));
    expect(tables).toContainEqual(expect.objectContaining({ model: 'hr_transportation_assignments', table: 'hr_transportation_assignments', domain: 'people' }));
  });

  it('excludes security and operational models while grouping business records', () => {
    const models = getDataModelTables().map((item) => item.model);
    expect(models).not.toContain('UserSession');
    expect(models).not.toContain('SystemApiKey');
    expect(models).not.toContain('AuditEvent');
    expect(getDataTransferDomain('LeaveRequest')).toBe('leave');
    expect(getDataTransferDomain('PayrollRun')).toBe('payroll');
    expect(getDataTransferDomain('hr_transportation_assignments')).toBe('people');
    expect(getDataTransferDomain('hr_assets')).toBe('people');
    expect(getDataTransferDomain('hr_asset_assignments')).toBe('people');
    expect(getDataTransferDomain('hr_internal_mobility_applications')).toBe('people');
    expect(getDataTransferDomain('hr_succession_plans')).toBe('people');
  });

  it('accepts the versioned portable backup envelope', () => {
    const backup = parseDataModelBackup(Buffer.from(JSON.stringify({ format: DATA_MODEL_BACKUP_FORMAT, exportedAt: '2026-01-01T00:00:00.000Z', schemaVersion: '1.0.0', domains: ['people'], models: [] })));
    expect(backup.format).toBe(DATA_MODEL_BACKUP_FORMAT);
  });

  it('rejects arbitrary JSON files', () => {
    expect(() => parseDataModelBackup(Buffer.from('{"models":[]}'))).toThrow(DATA_MODEL_BACKUP_FORMAT);
  });

  it('creates a checksummed split JSONL package that can be validated before import', async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const zipped = await createBusinessTransferPackage(client as never, ['leave']);
    const parsed = await parseBusinessTransferPackage(zipped);
    expect(parsed.domains).toEqual(['leave']);
    expect(parsed.models.length).toBeGreaterThan(0);
  });
});
