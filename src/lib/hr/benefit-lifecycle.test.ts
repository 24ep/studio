import { describe, expect, it } from 'vitest';

import { resolveBenefitTransition } from './benefit-lifecycle';

describe('resolveBenefitTransition', () => {
  it('lets an employee withdraw a pending application', () => {
    expect(resolveBenefitTransition('pending_approval', 'withdraw', 'employee')).toBe('withdrawn');
  });

  it('lets an employee resubmit a returned application', () => {
    expect(resolveBenefitTransition('returned_for_revision', 'resubmit', 'employee')).toBe('pending_approval');
  });

  it('turns active coverage into a termination approval request', () => {
    expect(resolveBenefitTransition('active', 'request_termination', 'employee')).toBe('pending_termination');
  });

  it('lets a manager approve a pending application', () => {
    expect(resolveBenefitTransition('pending_approval', 'approve', 'manager')).toBe('active');
  });

  it('lets a manager return an application for revision', () => {
    expect(resolveBenefitTransition('pending_approval', 'return', 'manager')).toBe('returned_for_revision');
  });

  it('ends active coverage after manager approval of termination', () => {
    expect(resolveBenefitTransition('pending_termination', 'approve', 'manager')).toBe('ended');
  });

  it('rejects invalid transitions', () => {
    expect(() => resolveBenefitTransition('active', 'withdraw', 'employee')).toThrow('Benefit action is no longer available');
  });
});
