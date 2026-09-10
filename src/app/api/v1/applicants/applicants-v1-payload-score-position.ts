import { isRecord } from './applicants-v1-payload-guards';
import type {
  ApplicantInfo,
  JobReference,
} from './applicants-v1-payload-types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asJobReference(value: unknown): JobReference {
  return isRecord(value) ? value : {};
}

function getNumericFitScore(value: unknown): number | undefined {
  return typeof value === 'number' ? Math.round(value) : undefined;
}

function getValidPositionId(positionId: unknown): string | null {
  if (typeof positionId !== 'string') {
    return null;
  }

  if (!UUID_REGEX.test(positionId)) {
    console.warn(`Invalid positionId format: ${positionId}`);
    return null;
  }

  return positionId;
}

function findJobMatchPositionId(jobMatches: unknown[]): string | null {
  const match = jobMatches.find((item) => asJobReference(item).jobId);
  return getValidPositionId(asJobReference(match).jobId);
}

export function resolveFitScore(applicantInfo: ApplicantInfo, jobApplied: unknown): number | undefined {
  return getNumericFitScore(applicantInfo.fitScore)
    ?? getNumericFitScore(asJobReference(applicantInfo.job_applied).fitScore)
    ?? getNumericFitScore(asJobReference(jobApplied).fitScore);
}

export function findPositionId(applicantInfo: ApplicantInfo, jobApplied: unknown, jobMatches: unknown[]): string | null {
  return getValidPositionId(asJobReference(applicantInfo.job_applied).jobId)
    ?? getValidPositionId(asJobReference(jobApplied).jobId)
    ?? findJobMatchPositionId(applicantInfo.job_matches)
    ?? findJobMatchPositionId(jobMatches);
}
