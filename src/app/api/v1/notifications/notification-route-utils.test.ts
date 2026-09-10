import { describe, expect, it } from 'vitest';
import {
  formatNotificationValidationErrors,
  getNotificationActingUserName,
  getNotificationRouteErrorMessage,
  isBulkNotificationBody,
  parseNotificationListParams,
} from './notification-route-utils';

describe('notification route utils', () => {
  it('formats validation errors in the legacy API shape', () => {
    expect(formatNotificationValidationErrors({
      title: ['Notification title is required'],
      notifications: ['At least one notification is required'],
    })).toBe('title: Notification title is required; notifications: At least one notification is required');
  });

  it('falls back through acting user fields', () => {
    expect(getNotificationActingUserName({ id: 'user-1', email: 'user@example.com', role: 'User' })).toBe('user@example.com');
    expect(getNotificationActingUserName({ id: 'user-1', role: 'User' })).toBe('user-1');
  });

  it('normalizes unknown errors to strings', () => {
    expect(getNotificationRouteErrorMessage(new Error('failed'))).toBe('failed');
    expect(getNotificationRouteErrorMessage('plain failure')).toBe('plain failure');
  });

  it('parses list query params with previous defaults', () => {
    expect(parseNotificationListParams('https://example.com/api/v1/notifications')).toEqual({
      limit: 50,
      offset: 0,
      isRead: null,
    });
    expect(parseNotificationListParams('https://example.com/api/v1/notifications?limit=10&offset=5&isRead=false')).toEqual({
      limit: 10,
      offset: 5,
      isRead: 'false',
    });
  });

  it('detects only array-backed bulk notification bodies', () => {
    expect(isBulkNotificationBody({ notifications: [] })).toBe(true);
    expect(isBulkNotificationBody({ notifications: 'nope' })).toBe(false);
    expect(isBulkNotificationBody(null)).toBe(false);
  });
});
