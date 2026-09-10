import { beforeEach, describe, expect, it, vi } from 'vitest';

import { safeFetch } from '@/lib/safe-fetch';
import {
  extractTaskboardApplicants,
  refreshTaskboardApplicantsIfChanged,
  reloadTaskboardApplicants,
  shouldHandleMyTasksApplicantRefreshEvent,
} from './my-tasks-applicant-refresh-utils';
import type { TaskboardApplicant } from './my-tasks-page-utils';

vi.mock('@/lib/safe-fetch', () => ({
  safeFetch: vi.fn(),
}));

const mockedSafeFetch = vi.mocked(safeFetch);

function applicant(id: string, updatedAt = '2026-01-01T00:00:00.000Z'): TaskboardApplicant {
  return { id, name: `Applicant ${id}`, updatedAt };
}

describe('my tasks applicant refresh utilities', () => {
  beforeEach(() => {
    mockedSafeFetch.mockReset();
  });

  it('recognizes realtime event types that should refresh applicants', () => {
    expect(shouldHandleMyTasksApplicantRefreshEvent('Applicant_update')).toBe(true);
    expect(shouldHandleMyTasksApplicantRefreshEvent('position_update')).toBe(true);
    expect(shouldHandleMyTasksApplicantRefreshEvent('dashboard_update')).toBe(true);
    expect(shouldHandleMyTasksApplicantRefreshEvent('notification_update')).toBe(false);
  });

  it('extracts applicants from arrays and wrapped API responses', () => {
    const list = [applicant('a')];

    expect(extractTaskboardApplicants(list)).toEqual(list);
    expect(extractTaskboardApplicants({ data: list })).toEqual(list);
    expect(extractTaskboardApplicants({ data: null })).toEqual([]);
  });

  it('reloads applicants and resets on failed endpoint responses', async () => {
    const setApplicants = vi.fn();
    const setLoading = vi.fn();
    mockedSafeFetch.mockResolvedValueOnce({
      data: null,
      error: 'failed',
      ok: false,
      status: 500,
    });

    await reloadTaskboardApplicants({
      buildTaskboardApplicantParams: () => new URLSearchParams({ page: '1' }),
      resetOnFailure: true,
      setApplicants,
      setLoading,
    });

    expect(mockedSafeFetch).toHaveBeenCalledWith('/api/taskboard/applicants?page=1', { timeoutMs: 6000 });
    expect(setApplicants).toHaveBeenCalledWith([]);
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('updates periodic applicants only when snapshots changed', async () => {
    const setApplicants = vi.fn();
    mockedSafeFetch.mockResolvedValueOnce({
      data: [applicant('a', '2026-01-02T00:00:00.000Z')],
      error: null,
      ok: true,
      status: 200,
    });

    await refreshTaskboardApplicantsIfChanged({
      applicants: [applicant('a')],
      buildTaskboardApplicantParams: () => new URLSearchParams(),
      setApplicants,
    });

    expect(setApplicants).toHaveBeenCalledWith([applicant('a', '2026-01-02T00:00:00.000Z')]);
  });
});
