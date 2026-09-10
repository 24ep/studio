import { describe, expect, it } from 'vitest';

import { leaveWorkspaceActionSchema } from './leave-workspace-service';

const employeeId = '3f116ae1-8a62-4e27-8b6d-cdb772ff32fb';
const policyId = 'aa6d5b90-c121-4eb7-817f-8717bdd35c20';

describe('leave workspace action contract', () => {
  it('accepts a controlled manual adjustment with idempotency', () => {
    const parsed = leaveWorkspaceActionSchema.parse({
      action: 'balance_adjustment',
      employeeId,
      policyId,
      year: 2026,
      units: -1.5,
      reason: 'Correct duplicate opening balance',
      effectiveDate: '2026-07-29',
      idempotencyKey: 'adjustment:employee:2026:001',
    });
    expect(parsed.action).toBe('balance_adjustment');
    if (parsed.action !== 'balance_adjustment') throw new Error('Unexpected action parsed.');
    expect(parsed.units).toBe(-1.5);
  });

  it('rejects an encashment without acknowledgment', () => {
    const parsed = leaveWorkspaceActionSchema.safeParse({
      action: 'create_encashment',
      employeeId,
      policyId,
      requestedUnits: 2,
      reason: 'Year-end encashment',
      acknowledgment: false,
    });
    expect(parsed.success).toBe(false);
  });

  it('limits bulk assignment size', () => {
    const parsed = leaveWorkspaceActionSchema.safeParse({
      action: 'assignment_apply',
      policyId,
      assignmentType: 'all',
      employeeIds: Array.from({ length: 1001 }, () => employeeId),
      effectiveFrom: '2026-01-01',
      priority: 100,
    });
    expect(parsed.success).toBe(false);
  });
});
