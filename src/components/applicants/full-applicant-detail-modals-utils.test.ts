import { describe, expect, it } from 'vitest';
import {
  getEvaluateLinkInitialData,
  getEvaluateLinkInterviewers,
} from './full-applicant-detail-modals-utils';

describe('full-applicant-detail-modals-utils', () => {
  it('normalizes evaluation link interviewers from custom attributes', () => {
    expect(getEvaluateLinkInterviewers([
      { id: 'user-1', name: 'Ada' },
      { id: 'missing-name' },
      null,
      { id: 2, name: 'Grace' },
    ])).toEqual([{ id: 'user-1', name: 'Ada' }]);

    expect(getEvaluateLinkInterviewers({ id: 'user-1', name: 'Ada' })).toBeUndefined();
  });

  it('builds evaluation link initial edit data from custom attributes', () => {
    expect(getEvaluateLinkInitialData({
      interviewDateTime: '2026-06-01T09:15:00',
      interviewLocation: 'Room 4',
      interviewers: [{ id: 'user-1', name: 'Ada' }],
    })).toEqual({
      interviewDateTime: '2026-06-01T09:15:00',
      interviewLocation: 'Room 4',
      interviewers: [{ id: 'user-1', name: 'Ada' }],
    });

    expect(getEvaluateLinkInitialData(null)).toEqual({
      interviewDateTime: undefined,
      interviewLocation: undefined,
      interviewers: undefined,
    });
  });
});
