import { describe, expect, it } from 'vitest';

import { buildProbationDecisionMutation } from './probation-decision';

describe('buildProbationDecisionMutation', () => {
  it('activates an employee when employment is confirmed', () => {
    expect(buildProbationDecisionMutation('confirm', '2026-05-01', '2026-08-01')).toEqual({
      employeeStatus: 'active', endDate: null, probationPeriodDays: null,
    });
  });

  it('turns an extension end date into an employee-specific probation period', () => {
    expect(buildProbationDecisionMutation('extend', '2026-05-01', '2026-09-28')).toEqual({
      employeeStatus: 'probation', endDate: null, probationPeriodDays: 150,
    });
  });

  it('ends employment on the selected date', () => {
    expect(buildProbationDecisionMutation('end', '2026-05-01', '2026-08-01')).toEqual({
      employeeStatus: 'inactive', endDate: '2026-08-01', probationPeriodDays: null,
    });
  });

  it('rejects an invalid extension window', () => {
    expect(() => buildProbationDecisionMutation('extend', '2026-05-01', '2026-04-30')).toThrow(/before the employee hire date/);
  });
});
