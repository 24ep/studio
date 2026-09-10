import { describe, expect, it, vi } from 'vitest';
import {
  EvaluatePageAuthRedirectError,
  fetchEvaluateApplicantAndCriteria,
  fetchEvaluatePersonalityGroupsConfig,
  fetchEvaluatePositionInterviewers,
  fetchExistingApplicantEvaluationData,
} from './evaluate-page-api';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('evaluate-page-api', () => {
  it('loads evaluate applicant data and criteria with optional tokenized URLs', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.startsWith('/api/applicants/applicant-1')) {
        return jsonResponse({
          id: 'applicant-1',
          positionId: 'position-1',
          position: { title: 'Engineer' },
        });
      }

      return jsonResponse({ personalityTraits: [{ id: 'trait-1' }] });
    }) as unknown as typeof fetch;

    await expect(fetchEvaluateApplicantAndCriteria('applicant-1', 'share token', fetcher)).resolves.toEqual({
      applicant: {
        id: 'applicant-1',
        positionId: 'position-1',
        position: { title: 'Engineer' },
      },
      applicantPositionId: 'position-1',
      positionTitle: 'Engineer',
      evaluationCriteria: { personalityTraits: [{ id: 'trait-1' }] },
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/applicants/applicant-1?token=share%20token');
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/v1/positions/position-1/evaluation?token=share%20token');
  });

  it('signals auth redirects for protected evaluate applicant or criteria responses', async () => {
    const applicantAuthFetcher = vi.fn(async () => jsonResponse({ message: 'forbidden' }, { status: 403 })) as unknown as typeof fetch;
    await expect(fetchEvaluateApplicantAndCriteria('applicant-1', null, applicantAuthFetcher)).rejects.toBeInstanceOf(EvaluatePageAuthRedirectError);

    const criteriaAuthFetcher = vi.fn(async (url: string) => {
      if (url.startsWith('/api/applicants/')) {
        return jsonResponse({ id: 'applicant-1', positionId: 'position-1' });
      }
      return jsonResponse({ message: 'unauthorized' }, { status: 401 });
    }) as unknown as typeof fetch;
    await expect(fetchEvaluateApplicantAndCriteria('applicant-1', null, criteriaAuthFetcher)).rejects.toBeInstanceOf(EvaluatePageAuthRedirectError);
  });

  it('rejects evaluate applicants without assigned positions', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ id: 'applicant-1', positionId: null })) as unknown as typeof fetch;

    await expect(fetchEvaluateApplicantAndCriteria('applicant-1', null, fetcher)).rejects.toThrow('Applicant has no assigned position');
  });

  it('loads all applicant evaluations before falling back to the single evaluation endpoint', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/evaluations')) {
        return jsonResponse([{ id: 'evaluation-1' }]);
      }
      return jsonResponse({ id: 'single-evaluation' });
    }) as unknown as typeof fetch;

    await expect(fetchExistingApplicantEvaluationData('applicant-1', fetcher)).resolves.toEqual([
      { id: 'evaluation-1' },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('falls back to single applicant evaluation when all evaluations request fails', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/evaluations')) {
        return jsonResponse({ message: 'not found' }, { status: 404 });
      }
      return jsonResponse({ id: 'single-evaluation' });
    }) as unknown as typeof fetch;

    await expect(fetchExistingApplicantEvaluationData('applicant-1', fetcher)).resolves.toEqual({
      id: 'single-evaluation',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('normalizes personality group responses to arrays', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ groups: [{ id: 'group-1' }] })) as unknown as typeof fetch;
    await expect(fetchEvaluatePersonalityGroupsConfig(fetcher)).resolves.toEqual([{ id: 'group-1' }]);

    const emptyFetcher = vi.fn(async () => jsonResponse({ groups: null })) as unknown as typeof fetch;
    await expect(fetchEvaluatePersonalityGroupsConfig(emptyFetcher)).resolves.toEqual([]);
  });

  it('normalizes interviewer responses to arrays and includes credentials', async () => {
    const fetcher = vi.fn(async () => jsonResponse([{ id: 'interviewer-1' }])) as unknown as typeof fetch;
    await expect(fetchEvaluatePositionInterviewers('position-1', fetcher)).resolves.toEqual([{ id: 'interviewer-1' }]);
    expect(fetcher).toHaveBeenCalledWith('/api/positions/position-1/interviewers', { credentials: 'include' });

    const failedFetcher = vi.fn(async () => jsonResponse({ message: 'nope' }, { status: 500 })) as unknown as typeof fetch;
    await expect(fetchEvaluatePositionInterviewers('position-1', failedFetcher)).resolves.toEqual([]);
  });
});
