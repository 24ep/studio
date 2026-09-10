import { describe, expect, it } from 'vitest';
import { assignmentViewModel } from './learning-assignment-view-model';

describe('assignmentViewModel', () => {
  it('shows submit for no submission', () => {
    expect(assignmentViewModel(null)).toMatchObject({ state: 'not_submitted', actionLabel: 'Submit assignment', canSubmit: true });
  });

  it('shows pending as awaiting review without duplicate submit', () => {
    expect(assignmentViewModel({ status: 'pending' })).toMatchObject({ state: 'pending', canSubmit: false });
  });

  it('shows reviewer feedback and resubmit for changes requested', () => {
    expect(assignmentViewModel({ status: 'changes_requested', feedback: 'Add evidence.' })).toMatchObject({ state: 'changes_requested', actionLabel: 'Resubmit', canSubmit: true, feedback: 'Add evidence.' });
  });

  it('shows approved as completed', () => {
    expect(assignmentViewModel({ status: 'approved' })).toMatchObject({ state: 'approved', canSubmit: false });
  });

  it('uses a safe neutral state for unknown status', () => {
    expect(assignmentViewModel({ status: 'legacy' })).toMatchObject({ state: 'unknown', canSubmit: false });
  });
});
