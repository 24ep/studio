import { describe, expect, it, vi } from 'vitest';
import type { Applicant } from '../../lib/types';
import {
  buildApplicantFlagUpdateRequest,
  getNextApplicantPinValue,
  getNextApplicantReadValue,
  toggleApplicantPinStatus,
} from './applicant-table-actions';

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id || 'applicant-1',
    name: 'Ada',
    email: 'ada@example.com',
    parsedData: null,
    positionId: null,
    fitScore: 0,
    statusId: '',
    applicationDate: '2026-01-01',
    transitionHistory: [],
    ...overrides,
  };
}

describe('applicant-table-actions', () => {
  it('builds next pin and read values', () => {
    expect(getNextApplicantPinValue({ isPinned: true })).toBe(false);
    expect(getNextApplicantPinValue({ isPinned: false })).toBe(true);
    expect(getNextApplicantReadValue({ isRead: false })).toBe(true);
    expect(getNextApplicantReadValue({ isRead: true })).toBe(false);
    expect(getNextApplicantReadValue({ isRead: null })).toBe(false);
  });

  it('builds update requests', () => {
    expect(buildApplicantFlagUpdateRequest({ isPinned: true })).toEqual({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"isPinned":true}',
    });
  });

  it('updates pin status and refreshes the applicant', async () => {
    const fetcher = vi.fn(async () => ({ ok: true }));
    const refresh = vi.fn(async () => undefined);

    await toggleApplicantPinStatus(makeApplicant({ isPinned: false }), refresh, fetcher);

    expect(fetcher).toHaveBeenCalledWith('/api/applicants/applicant-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"isPinned":true}',
    });
    expect(refresh).toHaveBeenCalledWith('applicant-1');
  });
});
