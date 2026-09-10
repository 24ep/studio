import { describe, expect, it, vi } from 'vitest';

import {
  loadApplicantDetailPreviewData,
  normalizeApplicantDetailComments,
} from './applicant-detail-view-api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function responseSequence(responses: Response[]): typeof fetch {
  const fetcher = vi.fn(async () => {
    const response = responses.shift();
    return response ?? jsonResponse({ error: 'missing mock response' }, 500);
  });

  return fetcher as unknown as typeof fetch;
}

describe('applicant detail view API helpers', () => {
  it('normalizes comments from list and paginated response shapes', () => {
    expect(normalizeApplicantDetailComments([
      { id: 'comment-1', comment: 'Strong candidate' },
      null,
      'invalid',
    ])).toEqual([{ id: 'comment-1', comment: 'Strong candidate' }]);

    expect(normalizeApplicantDetailComments({
      data: [{ id: 'comment-2', comment: 'Follow up' }],
    })).toEqual([{ id: 'comment-2', comment: 'Follow up' }]);
  });

  it('loads preview comments, attachments, and lite applicant data', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = responseSequence([
      jsonResponse({ data: [{ id: 'comment-1', comment: 'Strong candidate' }] }),
      jsonResponse({
        data: [{
          id: 'resume-1',
          fileName: 'resume.pdf',
          filePath: '/uploads/resume.pdf',
        }],
      }),
      jsonResponse({
        id: 'applicant-1',
        name: 'Ada Candidate',
        email: 'ada@example.com',
      }),
    ]);

    try {
      await expect(loadApplicantDetailPreviewData('applicant-1')).resolves.toMatchObject({
        comments: [{ id: 'comment-1' }],
        attachments: [{ id: 'resume-1', fileName: 'resume.pdf' }],
        initialApplicant: { id: 'applicant-1', name: 'Ada Candidate' },
        applicantExists: true,
        error: null,
      });
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('marks the applicant missing on a lite applicant 404', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = responseSequence([
      jsonResponse([], 200),
      jsonResponse([], 200),
      jsonResponse({ message: 'Not found' }, 404),
    ]);

    try {
      await expect(loadApplicantDetailPreviewData('missing')).resolves.toMatchObject({
        comments: [],
        attachments: [],
        initialApplicant: null,
        applicantExists: false,
        error: 'Applicant not found',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
