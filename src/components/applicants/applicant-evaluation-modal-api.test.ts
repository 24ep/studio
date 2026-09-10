import { describe, expect, it, vi } from 'vitest';

import {
  createOrGetApplicantEvaluationLink,
  fetchApplicantEvaluationAttachments,
  fetchApplicantEvaluationLink,
  fetchApplicantEvaluationPositionValidation,
  fetchApplicantEvaluationSummary,
  formatPersonalityScore,
  getDaysUntil,
  normalizeApplicantEvaluationLinkState,
  removeApplicantEvaluationLink,
  summarizeApplicantEvaluations,
} from './applicant-evaluation-modal-api';
import {
  normalizeAttachments,
  normalizeCreatedBy,
  normalizeEvaluationData,
} from './applicant-evaluation-modal-normalizers';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

const evaluation = {
  expertiseScores: [],
  personalityScores: [{ trait: { id: 'trait-1', name: 'Focus' }, score: 4 }],
  overallScore: 4,
  status: 'completed',
  comments: 'Good',
  evaluator: { name: 'Ada', email: 'ada@example.test' },
  completedAt: '2026-06-01T00:00:00.000Z',
};

describe('applicant evaluation modal helpers', () => {
  it('formats scores and calculates expiration days', () => {
    expect(formatPersonalityScore(4)).toBe('4');
    expect(formatPersonalityScore(4.25)).toBe('4.3');
    expect(getDaysUntil('2026-06-03T00:00:00.000Z', new Date('2026-06-01T12:00:00.000Z').getTime())).toBe(2);
    expect(getDaysUntil('bad-date')).toBe(1);
  });

  it('summarizes multiple evaluations without dropping zero scores', () => {
    const summary = summarizeApplicantEvaluations([
      evaluation,
      {
        ...evaluation,
        overallScore: 2,
        personalityScores: [{ trait: { id: 'trait-1', name: 'Focus' }, score: 0 }],
      },
    ]);

    expect(summary.evaluationData).toBe(evaluation);
    expect(summary.averagedEvaluationData).toMatchObject({
      overallScore: 3,
      evaluatorCount: 2,
    });
    expect(summary.averagedEvaluationData?.personalityScores[0]).toMatchObject({
      averageScore: 2,
      evaluatorCount: 2,
    });
  });

  it('fetches position validation and evaluation summaries', async () => {
    const validationFetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/interviewers')) {
        return jsonResponse([{ id: 'i1' }]);
      }

      return jsonResponse({ expertiseSkills: [{ id: 'skill-1' }] });
    }) as unknown as typeof fetch;

    await expect(fetchApplicantEvaluationPositionValidation('position-1', validationFetcher)).resolves.toEqual({
      hasInterviewers: true,
      hasSkills: true,
    });

    const summaryFetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/evaluations')) {
        return jsonResponse([evaluation]);
      }

      return jsonResponse(null, { status: 404 });
    }) as unknown as typeof fetch;

    await expect(fetchApplicantEvaluationSummary('applicant-1', summaryFetcher)).resolves.toMatchObject({
      averagedEvaluationData: { overallScore: 4, evaluatorCount: 1 },
    });
  });

  it('falls back to single evaluation and normalizes attachments', async () => {
    const summaryFetcher = vi.fn(async (url: RequestInfo | URL) => (
      String(url).endsWith('/evaluations')
        ? jsonResponse({}, { status: 404 })
        : jsonResponse(evaluation)
    )) as unknown as typeof fetch;

    await expect(fetchApplicantEvaluationSummary('applicant-1', summaryFetcher)).resolves.toMatchObject({
      evaluationData: evaluation,
      averagedEvaluationData: { evaluatorCount: 1 },
    });

    await expect(fetchApplicantEvaluationAttachments(
      'applicant-1',
      async () => jsonResponse({ data: [{ id: 'resume-1' }] })
    )).resolves.toEqual([{ id: 'resume-1' }]);
  });

  it('normalizes malformed evaluation modal payloads safely', () => {
    expect(normalizeEvaluationData({
      expertiseScores: 'bad',
      personalityScores: [
        {
          trait: {
            id: 'trait-1',
            name: 'Focus',
            description: 42,
            group: { id: 'group-1', name: 'Core', color: '#123456' },
          },
          score: 3,
        },
        { trait: { id: 'bad' }, score: 'high' },
      ],
      overallScore: 'bad',
      status: 10,
      comments: null,
      evaluator: { name: 'Ada', email: 42 },
      completedAt: 100,
    })).toEqual({
      expertiseScores: [],
      personalityScores: [{
        trait: {
          id: 'trait-1',
          name: 'Focus',
          description: undefined,
          group: { id: 'group-1', name: 'Core', color: '#123456' },
        },
        score: 3,
      }],
      overallScore: 0,
      status: '',
      comments: '',
      evaluator: { name: 'Ada', email: '' },
      completedAt: '',
    });

    expect(normalizeAttachments({ data: [{ id: 'resume-1' }, 'bad', null] }))
      .toEqual([{ id: 'resume-1' }]);
    expect(normalizeCreatedBy({ id: 'user-1', name: 'Ada', email: '' })).toBeUndefined();
    expect(normalizeCreatedBy({ id: 'user-1', name: 'Ada', email: 'ada@example.test' }))
      .toEqual({ id: 'user-1', name: 'Ada', email: 'ada@example.test' });
  });

  it('normalizes, creates, fetches, and removes evaluation links', async () => {
    const linkData = {
      url: 'https://example.test/evaluate',
      expiresAt: '2026-06-03T00:00:00.000Z',
      requireLogin: false,
      existing: true,
    };

    expect(normalizeApplicantEvaluationLinkState(
      linkData,
      new Date('2026-06-01T00:00:00.000Z').getTime()
    )).toMatchObject({
      linkInfo: { url: linkData.url, expiresAt: linkData.expiresAt },
      requireLogin: false,
      expireDays: 2,
      existing: true,
    });

    await expect(fetchApplicantEvaluationLink(
      'applicant-1',
      async () => jsonResponse(linkData)
    )).resolves.toMatchObject({ linkInfo: { url: linkData.url } });

    await expect(createOrGetApplicantEvaluationLink({
      applicantId: 'applicant-1',
      expireDays: 7,
      requireLogin: true,
      force: false,
      fetcher: async () => jsonResponse(linkData),
    })).resolves.toMatchObject({ linkInfo: { url: linkData.url } });

    await expect(removeApplicantEvaluationLink(
      'applicant-1',
      async () => new Response(null, { status: 204 })
    )).resolves.toBeUndefined();
  });
});
