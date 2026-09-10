import { describe, expect, it } from 'vitest';

import {
  buildApplicantUpdateNotification,
  buildNotificationFromRealtimeEvent,
  buildPositionUpdateNotification,
  countUnreadNotifications,
  createLocalNotification,
  sanitizeNotifications,
} from './notification-context-utils';

describe('notification context utilities', () => {
  it('sanitizes API notifications and counts unread items', () => {
    const notifications = sanitizeNotifications([
      {
        id: 'notification-1',
        type: 'info',
        title: 'Hello',
        message: 'World',
        data: { applicantId: 'applicant-1' },
        isRead: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      { id: 'notification-2', title: 'Read', message: 'Done', isRead: true },
      'bad',
    ]);

    expect(notifications).toHaveLength(2);
    expect(notifications[1]).toMatchObject({
      id: 'notification-2',
      type: '',
      data: {},
      isRead: true,
    });
    expect(countUnreadNotifications(notifications)).toBe(1);
    expect(sanitizeNotifications({ notifications: [] })).toEqual([]);
  });

  it('creates local notifications with stable generated fields', () => {
    expect(createLocalNotification({
      type: 'info',
      title: 'Saved',
      message: 'Changes saved',
      data: {},
    }, new Date('2026-01-02T03:04:05.000Z'))).toEqual({
      id: '1767323045000',
      type: 'info',
      title: 'Saved',
      message: 'Changes saved',
      data: {},
      createdAt: '2026-01-02T03:04:05.000Z',
      isRead: false,
    });
  });

  it('builds realtime notification events and skips unrelated users or self events', () => {
    const event = {
      type: 'new_notification',
      targetUserId: 'user-1',
      notification: {
        type: 'info',
        title: 'Assigned',
        message: 'You were assigned',
        data: { positionId: 'position-1' },
      },
    };

    expect(buildNotificationFromRealtimeEvent(event, 'user-1')).toEqual({
      type: 'info',
      title: 'Assigned',
      message: 'You were assigned',
      data: { positionId: 'position-1' },
    });
    expect(buildNotificationFromRealtimeEvent(event, 'user-2')).toBeNull();
    expect(buildNotificationFromRealtimeEvent({
      ...event,
      notification: { ...event.notification, data: { actingUserId: 'user-1' } },
    }, 'user-1')).toBeNull();
  });

  it('builds applicant and position update notifications from compatible event shapes', () => {
    expect(buildApplicantUpdateNotification({
      type: 'Applicant_update',
      applicant: { id: 'applicant-1', name: 'Ada' },
    }, 'user-1')).toMatchObject({
      type: 'Applicant_update',
      message: 'Applicant Ada has been updated',
      data: { applicantId: 'applicant-1' },
    });

    expect(buildPositionUpdateNotification({
      type: 'position_update',
      position: { id: 'position-1', title: 'Engineer' },
    }, 'user-1')).toMatchObject({
      type: 'position_update',
      message: 'Position "Engineer" has been updated',
      data: { positionId: 'position-1' },
    });

    expect(buildApplicantUpdateNotification({
      type: 'Applicant_update',
      Applicant: { id: 'applicant-2', email: 'ada@example.test' },
    }, 'user-1')).toMatchObject({
      message: 'Applicant ada@example.test has been updated',
      data: { applicantId: 'applicant-2' },
    });
  });
});
