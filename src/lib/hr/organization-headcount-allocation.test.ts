import { describe, expect, it } from 'vitest';

import { findLimitingAllocation, type OrganizationAllocationSnapshot } from './organization-headcount-allocation';

function snapshot(name: string, allocation: number | null, reserved: number): OrganizationAllocationSnapshot {
  return { id: name, name, code: null, unitType: 'unit', allocation, reserved, remaining: allocation === null ? null : allocation - reserved };
}

describe('organization headcount allocation', () => {
  it('allows unlimited ancestors and available capacity', () => {
    expect(findLimitingAllocation([
      snapshot('Unit', null, 20),
      snapshot('Department', 5, 4),
    ], 1)).toBeUndefined();
  });

  it('returns the first configured ancestor that would be exceeded', () => {
    const limiting = findLimitingAllocation([
      snapshot('Unit', 10, 3),
      snapshot('Department', 4, 4),
      snapshot('Division', 100, 20),
    ], 1);
    expect(limiting?.name).toBe('Department');
  });

  it('treats zero as a real allocation and approval rechecks existing usage without double counting', () => {
    expect(findLimitingAllocation([snapshot('Unit', 0, 0)], 1)?.name).toBe('Unit');
    expect(findLimitingAllocation([snapshot('Unit', 1, 1)], 0)).toBeUndefined();
    expect(findLimitingAllocation([snapshot('Unit', 1, 2)], 0)?.name).toBe('Unit');
  });
});
