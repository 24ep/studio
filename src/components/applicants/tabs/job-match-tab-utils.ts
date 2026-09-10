import type { Position } from '@/lib/types';
import type { ApplicantJobMatchLike } from '../full-applicant-detail-utils';

export type JobMatchPosition = Position & {
  location?: string | null;
};

export function getJobMatchFitScore(match: ApplicantJobMatchLike) {
  return typeof match.fitScore === 'number' && Number.isFinite(match.fitScore) ? match.fitScore : null;
}

export function getJobMatchReasons(match: ApplicantJobMatchLike) {
  return Array.isArray(match.matchReasons)
    ? match.matchReasons.filter((reason): reason is string => typeof reason === 'string' && reason.trim().length > 0)
    : [];
}

export function getJobMatchPosition(positions: Position[], match: ApplicantJobMatchLike): JobMatchPosition | null {
  return (positions.find(position => position.id === match.jobId) ||
    positions.find(position => position.title === match.jobTitle) ||
    null) as JobMatchPosition | null;
}

export function getJobMatchDisplayTitle(position: Position | null, match: ApplicantJobMatchLike) {
  return position?.title || match.jobTitle || 'Unknown Position';
}
