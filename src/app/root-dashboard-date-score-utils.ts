import type { Applicant } from '@/lib/types';

import type { DbDateValue } from './root-dashboard-initial-types';

export function toIsoString(value: DbDateValue) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return new Date().toISOString();
}

export function normalizeFitScore(rowScore: number | null | undefined, parsedData: Applicant['parsedData']) {
  const score = getParsedFitScore(parsedData) ?? rowScore ?? 0;
  if (score > 0 && score < 1) {
    return Math.round(score * 100);
  }

  if (score >= 0 && score <= 100) {
    return Math.round(score);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getParsedFitScore(parsedData: Applicant['parsedData']) {
  if (!parsedData || typeof parsedData !== 'object') {
    return undefined;
  }

  const jobApplied = (parsedData as Record<string, unknown>).job_applied;
  if (!jobApplied || typeof jobApplied !== 'object') {
    return undefined;
  }

  const fitScore = (jobApplied as Record<string, unknown>).fitScore;
  return typeof fitScore === 'number' ? fitScore : undefined;
}
