import type { TestingResult } from './types';

export type EvaluationTestResultRemovalAction =
  | {
    type: 'direct-skill';
    url: string;
    successMessage: string;
    failureMessage: string;
    removeLocalResult: true;
  }
  | {
    type: 'group';
    url: string;
    confirmationMessage: string;
    successMessage: string;
    failureMessage: string;
    removeLocalResult: false;
  }
  | {
    type: 'invalid';
    message: string;
  };

export function buildEvaluationTestResultRemovalAction({
  positionId,
  testResult,
}: {
  positionId?: string | null;
  testResult?: Pick<TestingResult, 'assignmentId' | 'groupAssignmentId' | 'groupName'> | null;
}): EvaluationTestResultRemovalAction {
  if (!positionId) {
    return { type: 'invalid', message: 'Position not found' };
  }

  if (!testResult) {
    return { type: 'invalid', message: 'Test result not found' };
  }

  if (testResult.assignmentId) {
    return {
      type: 'direct-skill',
      url: `/api/positions/${positionId}/expertise-skills/${testResult.assignmentId}`,
      successMessage: 'Skill removed successfully',
      failureMessage: 'Failed to remove skill',
      removeLocalResult: true,
    };
  }

  if (testResult.groupAssignmentId) {
    const groupName = testResult.groupName || 'this group';
    return {
      type: 'group',
      url: `/api/positions/${positionId}/expertise-groups/${testResult.groupAssignmentId}`,
      confirmationMessage: `This skill is part of the '${groupName}' expertise group. To remove it, you must remove the entire group from the position. Do you want to continue?`,
      successMessage: 'Expertise group removed successfully',
      failureMessage: 'Failed to remove expertise group',
      removeLocalResult: false,
    };
  }

  return { type: 'invalid', message: 'Cannot remove skill - unknown assignment type' };
}
