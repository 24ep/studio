import { describe, expect, it, vi } from 'vitest';

import {
  createCalendarEvaluationLink,
  fetchCalendarPositionValidation,
  searchCalendarApplicants,
} from './calendar-create-link-api';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('calendar create-link API helpers', () => {
  it('searches applicants and normalizes supported response envelopes', async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      data: [
        { id: 'applicant-1', name: 'Ada', email: 'ada@example.com', avatarUrl: null, positionId: 'position-1' },
        { id: null, name: 'Invalid' },
      ],
    })) as unknown as typeof fetch;

    await expect(searchCalendarApplicants('Ada Lovelace', fetcher)).resolves.toEqual([
      { id: 'applicant-1', name: 'Ada', email: 'ada@example.com', avatarUrl: null, positionId: 'position-1', position: null },
    ]);
    expect(fetcher).toHaveBeenCalledWith('/api/applicants?name=Ada%20Lovelace&nameOperator=contains&limit=20', {
      credentials: 'include',
    });
    await expect(searchCalendarApplicants('   ', fetcher)).resolves.toEqual([]);
  });

  it('combines interviewer and evaluation endpoint results into position validation state', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/interviewers')) {
        return jsonResponse([{ id: 'interviewer-1', name: 'Jane', email: 'jane@example.com' }]);
      }

      return jsonResponse({ expertiseSkills: [{ id: 'skill-1' }] });
    }) as unknown as typeof fetch;

    await expect(fetchCalendarPositionValidation('position-1', 'Designer', fetcher)).resolves.toEqual({
      availableInterviewers: [{ id: 'interviewer-1', name: 'Jane', email: 'jane@example.com' }],
      positionValidation: {
        hasInterviewers: true,
        hasSkills: true,
        positionId: 'position-1',
        positionTitle: 'Designer',
        isLoading: false,
        error: null,
      },
    });
  });

  it('creates calendar evaluation links and surfaces API errors', async () => {
    const successFetcher = vi.fn(async () => jsonResponse({
      url: 'https://example.com/evaluate',
      expiresAt: '2026-06-01T00:00:00.000Z',
    })) as unknown as typeof fetch;

    await expect(createCalendarEvaluationLink('applicant-1', { days: 7, requireLogin: true }, successFetcher)).resolves.toEqual({
      url: 'https://example.com/evaluate',
      expiresAt: '2026-06-01T00:00:00.000Z',
    });
    expect(successFetcher).toHaveBeenCalledWith('/api/v1/applicants/applicant-1/evaluation-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ days: 7, requireLogin: true }),
    });

    const failureFetcher = vi.fn(async () => jsonResponse({ message: 'No access' }, { status: 403 })) as unknown as typeof fetch;
    await expect(createCalendarEvaluationLink('applicant-1', { days: 7, requireLogin: true }, failureFetcher)).rejects.toThrow('No access');
  });
});
