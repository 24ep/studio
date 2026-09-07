import { describe, expect, it } from 'vitest';

import { overtimeOwnerTransition } from './overtime-request-workflow';

describe('overtimeOwnerTransition', () => {
  it('submits a saved draft', () => {
    expect(overtimeOwnerTransition('draft', 'submit_overtime')).toBe('pending_approval');
  });

  it('resubmits a returned request', () => {
    expect(overtimeOwnerTransition('returned_for_revision', 'resubmit_overtime')).toBe('pending_approval');
  });

  it('withdraws a pending request', () => {
    expect(overtimeOwnerTransition('pending_approval', 'withdraw_overtime')).toBe('withdrawn');
  });

  it('does not let an employee mutate an approved request lifecycle', () => {
    expect(overtimeOwnerTransition('approved', 'cancel_overtime')).toBeNull();
  });
});
