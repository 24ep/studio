import { describe, expect, it } from 'vitest';

import {
  getAddInterviewersButtonLabel,
  getFilteredAvailableInterviewUsers,
  getInterviewInvitationResultMessage,
  getInterviewerSelectionSummary,
  getPersonPositionSuffix,
  setCheckedIdSelection,
  toggleIdSelection,
} from './send-interview-invitation-modal-utils';

describe('send interview invitation modal utils', () => {
  it('filters users already assigned as interviewers', () => {
    expect(getFilteredAvailableInterviewUsers([
      { id: 'u1', name: 'Ana', email: 'ana@example.com', role: 'Recruiter' },
      { id: 'u2', name: 'Bo', email: 'bo@example.com', role: 'Recruiter' },
    ], [
      { id: 'i1', userId: 'u1', userName: 'Ana', userEmail: 'ana@example.com' },
    ])).toEqual([
      { id: 'u2', name: 'Bo', email: 'bo@example.com', role: 'Recruiter' },
    ]);
  });

  it('toggles selected IDs without mutating the original set', () => {
    const original = new Set(['a']);

    expect(Array.from(toggleIdSelection(original, 'b')).sort()).toEqual(['a', 'b']);
    expect(Array.from(toggleIdSelection(original, 'a'))).toEqual([]);
    expect(Array.from(original)).toEqual(['a']);
    expect(Array.from(setCheckedIdSelection(original, 'b', true)).sort()).toEqual(['a', 'b']);
    expect(Array.from(setCheckedIdSelection(original, 'a', false))).toEqual([]);
  });

  it('formats interviewer picker labels', () => {
    expect(getInterviewerSelectionSummary(1, 3)).toBe('1 of 3 interviewer(s) selected');
    expect(getAddInterviewersButtonLabel(1)).toBe('Add 1 Interviewer');
    expect(getAddInterviewersButtonLabel(2)).toBe('Add 2 Interviewers');
    expect(getPersonPositionSuffix('Engineering Manager')).toBe(' - Engineering Manager');
    expect(getPersonPositionSuffix(null)).toBe('');
  });

  it('summarizes send results', () => {
    expect(getInterviewInvitationResultMessage({ successCount: 2, errorCount: 0 }))
      .toBe('Successfully sent 2 invitation(s)');
    expect(getInterviewInvitationResultMessage({ successCount: 1, errorCount: 1 }))
      .toBe('Sent 1 invitation(s), 1 failed');
  });
});
