import { describe, expect, it } from 'vitest';

import { benefitTeamActionSchema, decisionFromBenefitTeamAction } from './benefit-team-service';

describe('benefit team approval contract', () => {
  it('maps manager benefit actions to lifecycle decisions', () => {
    expect(decisionFromBenefitTeamAction('approve_benefit')).toBe('approve');
    expect(decisionFromBenefitTeamAction('reject_benefit')).toBe('reject');
    expect(decisionFromBenefitTeamAction('return_benefit')).toBe('return');
  });

  it('requires comments when rejecting or returning', () => {
    const id = '4c5f0be0-2b61-4cc2-a8b3-58aec5973975';
    expect(benefitTeamActionSchema.safeParse({ id, action: 'approve_benefit', expectedVersion: 1 }).success).toBe(true);
    expect(benefitTeamActionSchema.safeParse({ id, action: 'reject_benefit', expectedVersion: 1 }).success).toBe(false);
    expect(benefitTeamActionSchema.safeParse({ id, action: 'return_benefit', expectedVersion: 1, comment: 'Please attach eligibility evidence.' }).success).toBe(true);
  });
});
