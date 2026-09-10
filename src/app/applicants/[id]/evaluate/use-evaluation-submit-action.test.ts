import { describe, expect, it, vi } from 'vitest';

import {
  getEvaluationPostErrorMessage,
  postApplicantEvaluation,
  type EvaluationPostFetcher,
} from './use-evaluation-submit-action';

describe('evaluation submit action helpers', () => {
  it('posts evaluation payloads to the applicant evaluation endpoint', async () => {
    const savedEvaluation = { id: 'evaluation-1', status: 'completed' };
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => savedEvaluation,
    })) as unknown as EvaluationPostFetcher;

    const payload = {
      positionId: 'position-1',
      evaluatorId: undefined,
      personalityScores: [],
      expertiseScores: [],
      overallScore: 4,
      comments: 'Ready',
      status: 'completed' as const,
    };

    await expect(postApplicantEvaluation('applicant-1', payload, fetcher)).resolves.toBe(savedEvaluation);
    expect(fetcher).toHaveBeenCalledWith('/api/v1/applicants/applicant-1/evaluation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('normalizes failed submit responses into errors', async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Evaluation closed' }),
    })) as unknown as EvaluationPostFetcher;
    const payload = {} as Parameters<typeof postApplicantEvaluation>[1];

    await expect(postApplicantEvaluation('applicant-1', payload, fetcher)).rejects.toThrow('Evaluation closed');
  });

  it('falls back when submit error payloads are empty or malformed', () => {
    expect(getEvaluationPostErrorMessage({ message: '  ' }, 'Fallback')).toBe('Fallback');
    expect(getEvaluationPostErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(getEvaluationPostErrorMessage({ message: 'Use this' }, 'Fallback')).toBe('Use this');
  });
});
