import type { PositionValidation, SearchApplicant } from './calendar-page-types';

export function createEmptyPositionValidation(
  overrides: Partial<PositionValidation> = {},
): PositionValidation {
  return {
    hasInterviewers: false,
    hasSkills: false,
    positionId: null,
    positionTitle: null,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

export function canCreateCalendarEvaluationLink({
  selectedApplicant,
  positionValidation,
  sendAppointment,
  selectedInterviewerIds,
}: {
  selectedApplicant?: SearchApplicant | null;
  positionValidation: PositionValidation;
  sendAppointment: boolean;
  selectedInterviewerIds?: Set<string> | string[] | null;
}) {
  return Boolean(
    selectedApplicant &&
      !positionValidation.isLoading &&
      positionValidation.hasInterviewers &&
      positionValidation.hasSkills &&
      (!sendAppointment || getCalendarSelectionCount(selectedInterviewerIds) > 0),
  );
}

export function shouldShowCalendarPositionValidationWarning({
  selectedApplicant,
  positionValidation,
}: {
  selectedApplicant?: SearchApplicant | null;
  positionValidation: PositionValidation;
}) {
  return Boolean(
    selectedApplicant &&
      !positionValidation.isLoading &&
      (!positionValidation.hasInterviewers ||
        !positionValidation.hasSkills ||
        positionValidation.error),
  );
}

export function shouldShowCalendarSchedulingOptions({
  selectedApplicant,
  positionValidation,
}: {
  selectedApplicant?: SearchApplicant | null;
  positionValidation: PositionValidation;
}) {
  return Boolean(
    selectedApplicant &&
      !positionValidation.isLoading &&
      positionValidation.hasInterviewers &&
      positionValidation.hasSkills,
  );
}

export function getCalendarPositionValidationIssues(
  positionValidation: PositionValidation,
) {
  if (positionValidation.error) {
    return [positionValidation.error];
  }

  const issues: string[] = [];

  if (!positionValidation.hasInterviewers) {
    issues.push('No interviewers assigned to the position');
  }

  if (!positionValidation.hasSkills) {
    issues.push(
      'No evaluation skills assigned to the position (requires at least 1 personality or expertise skill)',
    );
  }

  return issues;
}

export function getCalendarPositionConfigurationUrl(positionId?: string | null) {
  return positionId ? `/positions/${positionId}` : null;
}

function getCalendarSelectionCount(selection?: Set<string> | string[] | null) {
  if (selection instanceof Set) {
    return selection.size;
  }

  return Array.isArray(selection) ? selection.length : 0;
}
