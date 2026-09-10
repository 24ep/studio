import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatEvaluationLinkCountdown,
  isEvalLinkStatus,
} from './evaluation-links-tab-utils';

describe('evaluation links tab utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates status filter values', () => {
    expect(isEvalLinkStatus('all')).toBe(true);
    expect(isEvalLinkStatus('active')).toBe(true);
    expect(isEvalLinkStatus('missing')).toBe(false);
  });

  it('formats countdown values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    expect(formatEvaluationLinkCountdown('2026-01-02T01:02:03.000Z')).toBe('1d 1h 2m 3s');
    expect(formatEvaluationLinkCountdown('2025-12-31T00:00:00.000Z')).toBe('expired');
    expect(formatEvaluationLinkCountdown('2026-01-02T00:00:00.000Z', '2026-01-01T01:00:00.000Z')).toBe('revoked');
  });
});
