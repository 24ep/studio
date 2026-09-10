export interface ApplicantEvaluationPositionValidation {
  hasInterviewers: boolean;
  hasSkills: boolean;
  isLoading: boolean;
  error?: string | null;
}

export type ApplicantEvaluationLinkActionState =
  | 'no-permission'
  | 'loading'
  | 'configuration-required'
  | 'create'
  | 'manage';

export const APPLICANT_EVALUATION_TESTING_SKILLS = [
  { name: 'English listening', score: 89, maxScore: 100 },
  { name: 'English Reading', score: 92, maxScore: 100 },
  { name: 'MS Word', score: 78, maxScore: 100 },
  { name: 'Excel', score: 85, maxScore: 100 },
  { name: 'Typing Thai', score: 95, maxScore: 100 },
  { name: 'Typing English', score: 88, maxScore: 100 },
];

export function clampEvaluationExpireDays(value: unknown) {
  const numericValue = Number(value);
  return Math.max(1, Math.min(365, Number.isFinite(numericValue) ? numericValue : 1));
}

export function hasApplicantEvaluationConfigIssue(positionValidation: ApplicantEvaluationPositionValidation) {
  return Boolean(
    !positionValidation.hasInterviewers ||
    !positionValidation.hasSkills ||
    positionValidation.error
  );
}

export function getApplicantEvaluationPositionValidationIssues(
  positionValidation: ApplicantEvaluationPositionValidation
) {
  if (positionValidation.error) {
    return [positionValidation.error];
  }

  const issues: string[] = [];

  if (!positionValidation.hasInterviewers) {
    issues.push('No interviewers assigned to the position');
  }

  if (!positionValidation.hasSkills) {
    issues.push('No evaluation skills assigned (requires at least 1 personality or expertise skill)');
  }

  return issues;
}

export function shouldShowApplicantEvaluationPositionWarning({
  positionValidation,
  hasLink,
}: {
  positionValidation: ApplicantEvaluationPositionValidation;
  hasLink: boolean;
}) {
  return Boolean(
    !positionValidation.isLoading &&
    hasApplicantEvaluationConfigIssue(positionValidation) &&
    !hasLink
  );
}

export function getApplicantEvaluationLinkActionState({
  canViewLinks,
  positionValidation,
  hasLink,
}: {
  canViewLinks: boolean;
  positionValidation: ApplicantEvaluationPositionValidation;
  hasLink: boolean;
}): ApplicantEvaluationLinkActionState {
  if (!canViewLinks) {
    return 'no-permission';
  }

  if (positionValidation.isLoading) {
    return 'loading';
  }

  if (hasApplicantEvaluationConfigIssue(positionValidation) && !hasLink) {
    return 'configuration-required';
  }

  return hasLink ? 'manage' : 'create';
}

export function canSubmitApplicantEvaluationLinkCreate({
  linkLoading,
  canCreateLink,
  positionValidation,
}: {
  linkLoading: boolean;
  canCreateLink: boolean;
  positionValidation: ApplicantEvaluationPositionValidation;
}) {
  return Boolean(
    !linkLoading &&
    canCreateLink &&
    positionValidation.hasInterviewers &&
    positionValidation.hasSkills
  );
}
