import { describe, expect, it } from 'vitest';

import {
  getSelectedApplicantIds,
  getSelectedApplicantsDescription,
} from './applicants-page-modals-utils';

describe('applicants page modal utilities', () => {
  it('formats selected applicant descriptions for bulk dialogs', () => {
    expect(getSelectedApplicantsDescription(1, 'status')).toBe('Change the status for 1 selected Applicant.');
    expect(getSelectedApplicantsDescription(2, 'status')).toBe('Change the status for 2 selected Applicants.');
    expect(getSelectedApplicantsDescription(1, 'recruiter')).toBe('Assign a recruiter to 1 selected Applicant.');
    expect(getSelectedApplicantsDescription(3, 'recruiter')).toBe('Assign a recruiter to 3 selected Applicants.');
  });

  it('converts selected applicant ids to an ordered array', () => {
    expect(getSelectedApplicantIds(new Set(['applicant-1', 'applicant-2']))).toEqual([
      'applicant-1',
      'applicant-2',
    ]);
  });
});
