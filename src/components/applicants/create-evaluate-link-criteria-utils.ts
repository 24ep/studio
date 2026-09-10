import type { CreateEvaluateLinkApplicantInfo } from './create-evaluate-link-types';

export function getApplicantPositionId(
  applicant: Pick<CreateEvaluateLinkApplicantInfo, 'positionId' | 'position'>
): string | undefined {
  return applicant.positionId || applicant.position?.id || undefined;
}

function getArraySettingCandidate(source: unknown, key: string) {
  return source && typeof source === 'object'
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

export function hasEvaluationSkills(evaluationCriteria: unknown): boolean {
  return [
    getArraySettingCandidate(evaluationCriteria, 'personalityTraits'),
    getArraySettingCandidate(evaluationCriteria, 'personalityGroups'),
    getArraySettingCandidate(evaluationCriteria, 'expertiseSkills'),
    getArraySettingCandidate(evaluationCriteria, 'expertiseGroups'),
  ].some((items) => Array.isArray(items) && items.length > 0);
}
