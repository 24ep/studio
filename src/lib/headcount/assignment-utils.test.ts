import { describe, expect, it } from 'vitest';

import {
  hasAssignedApplicant,
  shouldResetApplicantStatusAfterUnassign,
} from './assignment-utils';

describe('headcount assignment utilities', () => {
  it('detects assigned applicant headcount records defensively', () => {
    expect(hasAssignedApplicant({
      applicant: { id: 'applicant-1', statusId: 'stage-1' },
      position: { id: 'position-1' },
    })).toBe(true);

    expect(hasAssignedApplicant(null)).toBe(false);
    expect(hasAssignedApplicant({ applicant: null, position: { id: 'position-1' } })).toBe(false);
    expect(hasAssignedApplicant({ applicant: { id: 123 }, position: { id: 'position-1' } })).toBe(false);
    expect(hasAssignedApplicant({ applicant: { id: 'applicant-1' }, position: null })).toBe(false);
  });

  it('resets applicant status only when unassigning the final hired headcount', () => {
    expect(shouldResetApplicantStatusAfterUnassign(true, 0)).toBe(true);
    expect(shouldResetApplicantStatusAfterUnassign(true, 1)).toBe(false);
    expect(shouldResetApplicantStatusAfterUnassign(false, 0)).toBe(false);
    expect(shouldResetApplicantStatusAfterUnassign(null, 0)).toBe(false);
  });
});
