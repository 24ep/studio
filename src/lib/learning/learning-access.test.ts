import { describe, expect, it } from 'vitest';
import type { PlatformModuleId } from '@/lib/types';
import { getLearningCapabilities } from './learning-access';

function sessionUser(role: string, modulePermissions: PlatformModuleId[] = []) {
  return { role, modulePermissions };
}

describe('getLearningCapabilities', () => {
  it('allows a linked employee to use self-service without granting management', () => {
    expect(getLearningCapabilities(sessionUser('Employee'), 'employee-1')).toEqual({
      canUseLearningSelfService: true,
      canViewLearningManagement: false,
      canManageLearning: false,
      canReviewAssignments: false,
      canOverrideCompletion: false,
      canViewReports: false,
    });
  });

  it('grants learning management capabilities from HR_LEARNING_MANAGE', () => {
    expect(getLearningCapabilities(sessionUser('HR Manager', ['HR_LEARNING_MANAGE']), 'employee-1')).toEqual({
      canUseLearningSelfService: true,
      canViewLearningManagement: true,
      canManageLearning: true,
      canReviewAssignments: true,
      canOverrideCompletion: true,
      canViewReports: true,
    });
  });

  it('does not expose learner self-service when no employee is linked', () => {
    expect(getLearningCapabilities(sessionUser('Employee'), null).canUseLearningSelfService).toBe(false);
  });

  it('keeps the existing admin-role convention authoritative for management', () => {
    const capabilities = getLearningCapabilities(sessionUser('System Admin'), null);

    expect(capabilities).toMatchObject({
      canUseLearningSelfService: false,
      canViewLearningManagement: true,
      canManageLearning: true,
      canReviewAssignments: true,
      canOverrideCompletion: true,
      canViewReports: true,
    });
  });
});
