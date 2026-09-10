import { describe, expect, it, vi } from 'vitest';

import {
  buildApplicantAddedNotification,
  buildApplicantStatusChangeNotification,
  buildRecruiterAssignedNotification,
} from './notification-service-builders';
import {
  assertValidNotificationActorId,
  assertValidNotificationUserId,
  isSelfNotification,
} from './notification-service-validation';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';

describe('notification-service helpers', () => {
  it('builds assignment and applicant notification payloads', () => {
    expect(buildRecruiterAssignedNotification({
      positionId: 'position-1',
      positionTitle: 'Engineer',
      assignedByUserId: userId,
    })).toMatchObject({
      type: 'recruiter_assigned',
      title: 'Position Assignment',
      data: {
        positionId: 'position-1',
        assignedBy: userId,
      },
    });

    expect(buildApplicantAddedNotification({
      applicantId: 'applicant-1',
      applicantName: 'Ada',
      positionId: 'position-1',
      positionTitle: 'Engineer',
      addedByUserId: userId,
    })).toMatchObject({
      type: 'Applicant_added',
      message: 'A new applicant "Ada" has been added to position "Engineer"',
      data: {
        applicantId: 'applicant-1',
        addedBy: userId,
      },
    });

    expect(buildApplicantStatusChangeNotification({
      applicantId: 'applicant-1',
      applicantName: 'Ada',
      oldStatus: 'New',
      newStatus: 'Interview',
      positionId: 'position-1',
      positionTitle: 'Engineer',
      changedByUserId: userId,
    })).toMatchObject({
      type: 'Applicant_status_change',
      message: 'Applicant "Ada" status changed from "New" to "Interview" for position "Engineer"',
      data: {
        oldStatus: 'New',
        newStatus: 'Interview',
        changedBy: userId,
      },
    });
  });

  it('validates notification UUIDs and self-notification checks', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => assertValidNotificationUserId(userId)).not.toThrow();
    expect(() => assertValidNotificationActorId(otherUserId)).not.toThrow();
    expect(() => assertValidNotificationUserId('not-a-uuid')).toThrow('Invalid user ID format');
    expect(() => assertValidNotificationActorId('not-a-uuid')).toThrow('Invalid acting user ID format');
    expect(isSelfNotification(userId, userId)).toBe(true);
    expect(isSelfNotification(userId, otherUserId)).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
