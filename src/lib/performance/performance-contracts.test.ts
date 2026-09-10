import { describe, expect, it } from 'vitest';

import {
  canReadFeedback,
  canViewManagerPrivateNotes,
  derivePerformancePermissions,
  performanceMutationSchema,
  shouldRevealRating,
  statusLabel,
  toPerformanceStatus,
} from './performance-contracts';

const id = '00000000-0000-0000-0000-000000000001';

describe('performance workspace contracts', () => {
  it('validates a complete check-in and requires optimistic concurrency', () => {
    expect(performanceMutationSchema.safeParse({
      action: 'complete_check_in',
      id,
      employeeId: id,
      followUpItems: [],
      expectedVersion: 2,
    }).success).toBe(true);
    expect(performanceMutationSchema.safeParse({
      action: 'complete_check_in',
      id,
      employeeId: id,
    }).success).toBe(false);
  });

  it('prevents empty feedback and accepts a clear evidence-backed note', () => {
    expect(performanceMutationSchema.safeParse({
      action: 'give_feedback',
      recipientId: id,
      feedbackType: 'peer',
      visibility: 'recipient',
      context: '',
      idempotencyKey: 'feedback-123',
    }).success).toBe(false);
    expect(performanceMutationSchema.safeParse({
      action: 'give_feedback',
      recipientId: id,
      feedbackType: 'peer',
      visibility: 'recipient',
      context: 'Quarterly launch retrospective',
      wentWell: 'Kept cross-functional owners aligned.',
      isAnonymous: false,
      idempotencyKey: 'feedback-123',
    }).success).toBe(true);
  });

  it('enforces feedback visibility by role', () => {
    expect(canReadFeedback('recipient', { isRecipient: true, isManager: false, isHr: false })).toBe(true);
    expect(canReadFeedback('manager', { isRecipient: true, isManager: false, isHr: false })).toBe(false);
    expect(canReadFeedback('authorized_reviewer', { isRecipient: false, isManager: true, isHr: false })).toBe(false);
    expect(canReadFeedback('authorized_reviewer', { isRecipient: false, isManager: false, isHr: true })).toBe(true);
  });

  it('keeps employee, manager, and HR scopes distinct', () => {
    expect(derivePerformancePermissions({
      isAdministrator: false,
      hasHrView: false,
      isManager: false,
      canManagePerformance: false,
    })).toMatchObject({
      role: 'employee',
      canViewTeam: false,
      canViewOrganization: false,
      canViewPrivateManagerNotes: false,
    });
    expect(derivePerformancePermissions({
      isAdministrator: false,
      hasHrView: false,
      isManager: true,
      canManagePerformance: false,
    })).toMatchObject({
      role: 'manager',
      canViewTeam: true,
      canViewOrganization: false,
      canViewPrivateManagerNotes: true,
    });
    expect(derivePerformancePermissions({
      isAdministrator: false,
      hasHrView: true,
      isManager: false,
      canManagePerformance: true,
    })).toMatchObject({
      role: 'hr',
      canViewTeam: true,
      canViewOrganization: true,
    });
  });

  it('protects manager-private notes from the subject employee and unrelated managers', () => {
    expect(canViewManagerPrivateNotes({
      hasHrView: false,
      actorEmployeeId: 'employee-1',
      targetManagerId: 'manager-1',
    })).toBe(false);
    expect(canViewManagerPrivateNotes({
      hasHrView: false,
      actorEmployeeId: 'manager-1',
      targetManagerId: 'manager-1',
    })).toBe(true);
    expect(canViewManagerPrivateNotes({
      hasHrView: true,
      actorEmployeeId: null,
      targetManagerId: 'manager-1',
    })).toBe(true);
  });

  it('never reveals ratings before a released stage', () => {
    expect(shouldRevealRating('manager_review', true)).toBe(false);
    expect(shouldRevealRating('completed', false)).toBe(false);
    expect(shouldRevealRating('completed', true)).toBe(true);
  });

  it('derives a standardized text status from real record state', () => {
    expect(toPerformanceStatus({ reviewStatus: 'not_started' })).toBe('review_not_started');
    expect(toPerformanceStatus({ reviewStatus: 'completed', overdueActions: 1 })).toBe('attention_required');
    expect(toPerformanceStatus({ reviewStatus: 'completed' })).toBe('completed');
    expect(statusLabel('attention_required')).toBe('Attention Required');
  });
});
