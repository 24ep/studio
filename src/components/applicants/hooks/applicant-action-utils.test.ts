import { describe, expect, it } from 'vitest';

import {
  createLoadingApplicantSource,
  createLoadingRecruiter,
  getRecruiterAssignmentSuccessMessage,
  getSourceAssignmentSuccessMessage,
  isApplicantAiSearchLocked,
} from './applicant-action-utils';

describe('applicant-action-utils', () => {
  it('derives applicant action guard and assignment labels', () => {
    expect(isApplicantAiSearchLocked(null)).toBe(false);
    expect(isApplicantAiSearchLocked([])).toBe(true);
    expect(getRecruiterAssignmentSuccessMessage('user-1')).toBe('Recruiter assigned successfully');
    expect(getRecruiterAssignmentSuccessMessage(null)).toBe('Recruiter unassigned successfully');
    expect(getSourceAssignmentSuccessMessage('source-1')).toBe('Source assigned successfully');
    expect(getSourceAssignmentSuccessMessage(null)).toBe('Source unassigned successfully');
  });

  it('builds loading placeholders for optimistic assignment state', () => {
    expect(createLoadingRecruiter('user-1')).toEqual({
      id: 'user-1',
      name: 'Loading...',
      email: '',
      avatarUrl: null,
    });
    expect(createLoadingApplicantSource('source-1')).toMatchObject({
      id: 'source-1',
      name: 'Loading...',
      isActive: true,
    });
  });
});
