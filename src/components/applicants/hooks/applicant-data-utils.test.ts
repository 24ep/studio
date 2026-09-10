import { describe, expect, it, vi } from 'vitest';

import type { Applicant, JobMatch } from '@/lib/types';
import {
  asArrayData,
  fetchApplicantById,
  fetchApplicantDataForCounts,
  fetchApplicantPositionsAndStages,
  fetchApplicantRecruiters,
  fetchApplicantSources,
  getBestMatchingFitScore,
} from './applicant-data-utils';

function safeResult<T>(data: T | null, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    data: ok ? data : null,
    error: ok ? null : 'HTTP 500',
  };
}

function makeJobMatch(overrides: Partial<JobMatch> = {}): JobMatch {
  return {
    id: overrides.id ?? 'job-match-1',
    applicantId: overrides.applicantId ?? 'applicant-id',
    fitScore: overrides.fitScore ?? 0,
    ...overrides,
  };
}

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? 'applicant-id',
    name: overrides.name ?? 'Applicant',
    email: overrides.email ?? 'applicant@example.com',
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? 'applied',
    status: overrides.status ?? 'Applied',
    applicationDate: overrides.applicationDate ?? '2026-01-01T00:00:00.000Z',
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

describe('applicant data utilities', () => {
  it('normalizes array or keyed object data', () => {
    expect(asArrayData([{ id: 'a' }], 'items')).toEqual([{ id: 'a' }]);
    expect(asArrayData({ items: [{ id: 'b' }] }, 'items')).toEqual([{ id: 'b' }]);
    expect(asArrayData({ other: [] }, 'items')).toEqual([]);
    expect(asArrayData(null, 'items')).toEqual([]);
  });

  it('selects the best matching fit score from job matches first', () => {
    expect(getBestMatchingFitScore(makeApplicant({
      jobMatches: [makeJobMatch({ fitScore: 0.82 }), makeJobMatch({ fitScore: 71 })],
      parsedData: { job_matches: [{ fitScore: 99 }] } as unknown as Applicant['parsedData'],
    }))).toBe(71);

    expect(getBestMatchingFitScore(makeApplicant({
      parsedData: { job_matches: [{ fitScore: 35 }, { fitScore: 0.6 }] } as unknown as Applicant['parsedData'],
    }))).toBe(35);

    expect(getBestMatchingFitScore(makeApplicant({ parsedData: {} }))).toBe(0);
  });

  it('fetches applicant count data and applicant details', async () => {
    const countsFetcher = vi.fn().mockResolvedValue(safeResult({
      applicants: [{ id: 'applicant-1' }],
    }));
    await expect(fetchApplicantDataForCounts(countsFetcher)).resolves.toEqual([{ id: 'applicant-1' }]);
    expect(countsFetcher).toHaveBeenCalledWith('/api/applicants?limit=10000&includeCounts=true', {
      timeoutMs: 10000,
    });

    const applicantFetcher = vi.fn().mockResolvedValue(safeResult({ id: 'applicant-2' }));
    await expect(fetchApplicantById('applicant-2', applicantFetcher)).resolves.toEqual({ id: 'applicant-2' });
    expect(applicantFetcher).toHaveBeenCalledWith('/api/applicants/applicant-2', { timeoutMs: 8000 });

    await expect(fetchApplicantDataForCounts(vi.fn().mockResolvedValue(safeResult(null, false)))).resolves.toBeNull();
  });

  it('fetches applicant sources and recruiters', async () => {
    await expect(fetchApplicantSources(vi.fn().mockResolvedValue(safeResult({
      sources: [{ id: 'source-1', name: 'Referral' }],
    })))).resolves.toEqual([{ id: 'source-1', name: 'Referral' }]);

    await expect(fetchApplicantRecruiters(vi.fn().mockResolvedValue(safeResult({
      users: [{ id: 'user-1', name: 'Ada', email: 'ada@example.com', avatarUrl: '/ada.png', role: 'Recruiter' }],
    })))).resolves.toEqual([{
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      avatarUrl: '/ada.png',
    }]);
  });

  it('fetches applicant reference positions and stages', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(safeResult({ positions: [{ id: 'position-1' }] }))
      .mockResolvedValueOnce(safeResult([{ id: 'stage-1' }]));

    await expect(fetchApplicantPositionsAndStages(fetcher)).resolves.toEqual({
      positions: [{ id: 'position-1' }],
      stages: [{ id: 'stage-1' }],
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/positions', { timeoutMs: 8000 });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/recruitment-stages', { timeoutMs: 8000 });
  });
});
