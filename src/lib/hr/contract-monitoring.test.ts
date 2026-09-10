import { describe, expect, it } from 'vitest';
import { getContractExpiry } from './contract-monitoring';

describe('contract monitoring', () => {
  const now = new Date('2026-08-02T12:00:00.000Z');

  it('ignores full-time employees', () => {
    expect(getContractExpiry({ employmentType: 'full_time', endDate: null }, now).state).toBe('not_applicable');
  });

  it('flags missing non-full-time end dates', () => {
    expect(getContractExpiry({ employmentType: 'contractor', endDate: null }, now).state).toBe('missing_end_date');
  });

  it('uses each employee notice period', () => {
    expect(getContractExpiry({ employmentType: 'contractor', endDate: '2026-09-16', contractNoticeDays: 45 }, now)).toMatchObject({ state: 'due', daysRemaining: 45 });
    expect(getContractExpiry({ employmentType: 'contractor', endDate: '2026-09-16', contractNoticeDays: 30 }, now).state).toBe('scheduled');
  });
});
