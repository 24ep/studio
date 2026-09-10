import { describe, expect, it } from 'vitest';

import { shiftRequestOwnerTransition, validateShiftRequestTarget } from './shift-request-workflow';

describe('shiftRequestOwnerTransition', () => {
  it('submits a normal draft for manager approval', () => {
    expect(shiftRequestOwnerTransition('draft', 'submit_shift_request', 'shift_change')).toBe('pending_approval');
  });

  it('routes shift swaps through colleague acceptance', () => {
    expect(shiftRequestOwnerTransition('draft', 'submit_shift_request', 'shift_swap')).toBe('awaiting_employee');
  });

  it('resubmits returned requests through the correct route', () => {
    expect(shiftRequestOwnerTransition('returned_for_revision', 'resubmit_shift_request', 'shift_swap')).toBe('awaiting_employee');
  });

  it('allows pending requests to be withdrawn', () => {
    expect(shiftRequestOwnerTransition('pending_approval', 'withdraw_shift_request', 'shift_change')).toBe('withdrawn');
  });

  it('rejects owner lifecycle changes after a request is applied', () => {
    expect(shiftRequestOwnerTransition('applied', 'withdraw_shift_request', 'shift_change')).toBeNull();
  });
});

describe('validateShiftRequestTarget', () => {
  it('requires the colleague assignment for a swap', () => {
    expect(validateShiftRequestTarget({
      requestType: 'shift_swap',
      assignmentId: 'a',
      swapEmployeeId: 'b',
    })).toContain('colleague shift');
  });

  it('requires an open shift for open-shift requests', () => {
    expect(validateShiftRequestTarget({ requestType: 'open_shift' })).toContain('open shift');
  });
});
