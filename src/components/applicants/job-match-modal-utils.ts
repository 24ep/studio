import { formatScoreWithGrade } from '../../lib/scoreUtils';

export type JobMatchApplicantFilterType = 'applied' | 'matching' | 'matchingNotApplied';

export interface JobMatchStats {
  totalApplied: number;
  totalMatching: number;
  matchingNotApplied: number;
}

export const DEFAULT_JOB_MATCH_STATS: JobMatchStats = {
  totalApplied: 0,
  totalMatching: 0,
  matchingNotApplied: 0,
};

export function displayFitScoreWithGrade(score: number | undefined | null) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return '0% (E)';
  }

  return formatScoreWithGrade(score);
}

export function formatJobMatchRequirements(requirements: unknown) {
  if (typeof requirements === 'string') {
    return requirements;
  }

  if (Array.isArray(requirements)) {
    return requirements
      .filter((requirement): requirement is string => typeof requirement === 'string' && requirement.trim().length > 0)
      .join(', ');
  }

  return '';
}

export function buildJobMatchStatisticsUrl(jobId: string) {
  return `/api/positions/${encodeURIComponent(jobId)}/statistics`;
}

export function buildApplicantsAdvancedQuery(jobId: string, filterType: JobMatchApplicantFilterType) {
  switch (filterType) {
    case 'applied':
      return `positionId:${jobId}`;
    case 'matching':
      return `positionId:${jobId} minAppliedJobFitScore:70`;
    case 'matchingNotApplied':
      return `positionId:${jobId} minAppliedJobFitScore:80`;
  }
}

export function buildApplicantsSearchUrl(jobId: string, filterType: JobMatchApplicantFilterType) {
  return `/applicants?query=${encodeURIComponent(buildApplicantsAdvancedQuery(jobId, filterType))}`;
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function sanitizeJobMatchStats(value: unknown): JobMatchStats {
  if (!value || typeof value !== 'object') {
    return DEFAULT_JOB_MATCH_STATS;
  }

  const stats = value as Partial<Record<keyof JobMatchStats, unknown>>;
  return {
    totalApplied: readNumber(stats.totalApplied),
    totalMatching: readNumber(stats.totalMatching),
    matchingNotApplied: readNumber(stats.matchingNotApplied),
  };
}
