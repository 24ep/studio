import { describe, expect, it } from 'vitest';

import {
  appraisalMutationSchema,
  calculateWeightedRating,
  canRevealFinalRating,
  ratingLevelForScore,
} from './appraisal-contracts';

describe('appraisal rating rules', () => {
  it('calculates a normalized weighted rating', () => {
    expect(calculateWeightedRating([
      { score: 88, weight: 60, required: true },
      { score: 76, weight: 40, required: true },
    ])).toEqual({ score: 83.2, complete: true, reason: null });
  });

  it('blocks calculation when a required section is missing', () => {
    expect(calculateWeightedRating([
      { score: 88, weight: 60, required: true },
      { score: null, weight: 40, required: true },
    ])).toMatchObject({ score: null, complete: false });
  });

  it('finds a configured rating level without hardcoded labels', () => {
    const result = ratingLevelForScore([
      { code: 'ME', label: 'Meets', numericValue: 3, minScore: 60, maxScore: 79.99 },
      { code: 'EE', label: 'Exceeds', numericValue: 4, minScore: 80, maxScore: 89.99 },
    ], 84);
    expect(result?.code).toBe('EE');
  });

  it('does not reveal final ratings before release', () => {
    expect(canRevealFinalRating('awaiting_final_approval', null)).toBe(false);
    expect(canRevealFinalRating('released', '2026-07-29T12:00:00.000Z')).toBe(true);
  });
});

describe('appraisal action validation', () => {
  it('requires a reason and comment for rating overrides', () => {
    const parsed = appraisalMutationSchema.safeParse({
      action: 'override_rating',
      reviewId: '7826f87c-2687-43c8-bf3f-1be71b7ec579',
      newRating: 86,
      reason: 'Too short',
      comment: 'Also short',
      expectedVersion: 1,
    });
    expect(parsed.success).toBe(false);
  });

  it('distinguishes acknowledgment from agreement', () => {
    const parsed = appraisalMutationSchema.safeParse({
      action: 'acknowledge_result',
      reviewId: '7826f87c-2687-43c8-bf3f-1be71b7ec579',
      comment: 'I acknowledge receipt and would like to discuss the outcome.',
      requestDiscussion: true,
      expectedVersion: 3,
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts a non-empty batch of review reminders', () => {
    const parsed = appraisalMutationSchema.safeParse({
      action: 'send_reminders',
      reviewIds: [
        '7826f87c-2687-43c8-bf3f-1be71b7ec579',
        'ad65bc20-3983-4f0d-b0ad-6724462bc25d',
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty reminder batch', () => {
    const parsed = appraisalMutationSchema.safeParse({
      action: 'send_reminders',
      reviewIds: [],
    });
    expect(parsed.success).toBe(false);
  });
});
