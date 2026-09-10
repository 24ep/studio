import { describe, expect, it } from 'vitest';

import { castCreatePlaceholder, hrisResourceConfig, isHrisResource, listQuerySchema, mapRow, parseHrisResourceUpdate } from './hris-v1';

const employeeId = '00000000-0000-4000-8000-000000000001';

describe('HRIS v1 contracts', () => {
  it('uses a closed allowlist for dynamic resources', () => {
    expect(isHrisResource('assignments')).toBe(true);
    expect(isHrisResource('users; DROP TABLE users')).toBe(false);
  });

  it('validates effective-dated assignment creation', () => {
    const parsed = hrisResourceConfig.assignments.createSchema.safeParse({
      employeeId,
      assignmentType: 'primary',
      employmentType: 'full_time',
      effectiveFrom: '2026-08-01',
      reason: 'Initial controlled assignment',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects inverted effective-date and workforce-plan ranges', () => {
    expect(hrisResourceConfig.assignments.createSchema.safeParse({
      employeeId,
      assignmentType: 'primary',
      employmentType: 'full_time',
      effectiveFrom: '2026-08-02',
      effectiveTo: '2026-08-01',
      reason: 'Invalid historical range',
    }).success).toBe(false);

    expect(hrisResourceConfig['workforce-plans'].createSchema.safeParse({
      name: 'Invalid plan',
      planningPeriodStart: '2027-01-01',
      planningPeriodEnd: '2026-01-01',
      scenario: 'baseline',
    }).success).toBe(false);
  });

  it('rejects an offboarding notice after the last working date', () => {
    expect(hrisResourceConfig.exits.createSchema.safeParse({
      employeeId,
      exitType: 'resignation',
      noticeDate: '2026-09-01',
      lastWorkingDate: '2026-08-31',
      reason: 'Invalid notice range',
    }).success).toBe(false);
  });

  it('casts offboarding identifiers and dates for PostgreSQL inserts', () => {
    expect(castCreatePlaceholder('exits', 'employee_id', '$1')).toBe('$1::uuid');
    expect(castCreatePlaceholder('exits', 'company_id', '$2')).toBe('$2::uuid');
    expect(castCreatePlaceholder('exits', 'notice_date', '$3')).toBe('$3::date');
    expect(castCreatePlaceholder('exits', 'last_working_date', '$4')).toBe('$4::date');
    expect(castCreatePlaceholder('exits', 'checklist', '$5')).toBe('$5::jsonb');
    expect(castCreatePlaceholder('exits', 'reason', '$6')).toBe('$6');
  });

  it('rejects attributes that are not explicitly editable for a resource', () => {
    const parsed = parseHrisResourceUpdate('assets', { name: 'Laptop', companyId: '8fb21620-9d88-4e72-9b9a-6e2a0f390ec0' });

    expect(parsed.success).toBe(false);
  });

  it('accepts the complete supported offboarding task update shape', () => {
    const parsed = parseHrisResourceUpdate('exits', {
      checklist: [{ id: 'equipment-return', status: 'completed' }],
      accessRevocationStatus: 'completed',
      finalPayrollStatus: 'in_progress',
      completedAt: '2026-08-12T10:00:00.000Z',
    }, 'in_progress');

    expect(parsed.success).toBe(true);
  });

  it('rejects a status that does not belong to the selected resource', () => {
    const parsed = parseHrisResourceUpdate('asset-assignments', {}, 'published');

    expect(parsed.success).toBe(false);
  });

  it('rejects invalid confidential case types', () => {
    const parsed = hrisResourceConfig.cases.createSchema.safeParse({
      caseNumber: 'CASE-001',
      caseType: 'public_note',
      title: 'Invalid case',
      description: 'This should not pass.',
    });
    expect(parsed.success).toBe(false);
  });

  it('caps pagination and maps database fields to API casing', () => {
    expect(listQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(mapRow({ employee_id: employeeId, created_at: '2026-01-01' })).toEqual({
      employeeId,
      createdAt: '2026-01-01',
    });
  });
});
