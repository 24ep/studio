import { describe, expect, it } from 'vitest';

import {
  getApplicantEventAction,
  getApplicantUpdate,
  getDeletedApplicantId,
  removeApplicantById,
  replaceApplicantById,
  shouldHandleApplicantRealtimeRefreshEvent,
  shouldRunApplicantRealtimeRefresh,
} from './applicant-realtime-refresh-utils';
import type { Applicant } from '@/lib/types';

function applicant(id: string, name = id): Applicant {
  return {
    applicationDate: '2026-01-01T00:00:00.000Z',
    email: `${id}@example.com`,
    fitScore: 0,
    id,
    name,
    parsedData: null,
    positionId: null,
    statusId: 'applied',
    transitionHistory: [],
  };
}

describe('applicant realtime refresh utilities', () => {
  it('classifies realtime events and extracts event data', () => {
    expect(shouldHandleApplicantRealtimeRefreshEvent('Applicant_update')).toBe(true);
    expect(shouldHandleApplicantRealtimeRefreshEvent('position_update')).toBe(true);
    expect(shouldHandleApplicantRealtimeRefreshEvent('notification_update')).toBe(false);
    expect(getApplicantEventAction({ action: 'deleted' })).toBe('deleted');
    expect(getDeletedApplicantId({ applicantId: 'applicant-1' })).toBe('applicant-1');
    expect(getApplicantUpdate(applicant('applicant-1'))?.id).toBe('applicant-1');
    expect(getApplicantUpdate({ name: 'Missing id' })).toBeNull();
  });

  it('removes and replaces applicants defensively', () => {
    const applicants = [applicant('a'), applicant('b')];

    expect(removeApplicantById(applicants, 'a')).toEqual([applicant('b')]);
    expect(removeApplicantById(null, 'a')).toEqual([]);
    expect(replaceApplicantById(applicants, applicant('b', 'Updated'))).toEqual([
      applicant('a'),
      applicant('b', 'Updated'),
    ]);
    expect(replaceApplicantById(undefined, applicant('b'))).toEqual([]);
  });

  it('guards delayed full refresh execution', () => {
    expect(shouldRunApplicantRealtimeRefresh({
      isLoading: false,
      mounted: true,
      sessionStatus: 'authenticated',
      sessionUserId: 'user-1',
    })).toBe(true);
    expect(shouldRunApplicantRealtimeRefresh({
      isLoading: true,
      mounted: true,
      sessionStatus: 'authenticated',
      sessionUserId: 'user-1',
    })).toBe(false);
    expect(shouldRunApplicantRealtimeRefresh({
      isLoading: false,
      mounted: true,
      sessionStatus: 'unauthenticated',
      sessionUserId: 'user-1',
    })).toBe(false);
  });
});
