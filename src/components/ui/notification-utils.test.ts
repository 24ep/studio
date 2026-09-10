import { describe, expect, it } from 'vitest';
import {
  formatNotificationBadgeCount,
  formatNotificationRelativeTime,
  getLatestUnreadNotification,
  getNotificationAnimationDelay,
  getNotificationBuckets,
  isNotificationActivationKey,
  isNotificationDisplayItem,
} from './notification-utils';

const notification = (id: string, isRead = false) => ({
  id,
  title: `Title ${id}`,
  message: `Message ${id}`,
  isRead,
  createdAt: '2026-06-08T00:00:00.000Z',
});

describe('notification-utils', () => {
  it('splits valid notifications into unread and read buckets', () => {
    const buckets = getNotificationBuckets([
      notification('1'),
      notification('2', true),
      null,
      { id: 'bad' },
      notification('3'),
    ]);

    expect(buckets.unreadNotifications.map(item => item.id)).toEqual(['1', '3']);
    expect(buckets.readNotifications.map(item => item.id)).toEqual(['2']);
    expect(getNotificationBuckets(null)).toEqual({ unreadNotifications: [], readNotifications: [] });
  });

  it('detects displayable notification records', () => {
    expect(isNotificationDisplayItem(notification('1'))).toBe(true);
    expect(isNotificationDisplayItem({ ...notification('1'), createdAt: new Date() })).toBe(true);
    expect(isNotificationDisplayItem({ ...notification('1'), isRead: 'false' })).toBe(false);
  });

  it('gets the latest unread notification', () => {
    expect(getLatestUnreadNotification([notification('1', true), notification('2')])?.id).toBe('2');
    expect(getLatestUnreadNotification([notification('1', true)])).toBeNull();
  });

  it('formats relative notification times and invalid fallbacks', () => {
    expect(formatNotificationRelativeTime('not-a-date')).toBe('Unknown time');
    expect(formatNotificationRelativeTime(new Date())).toMatch(/less than a minute|minute|second/);
  });

  it('formats badge counts and animation delays', () => {
    expect(formatNotificationBadgeCount(3)).toBe(3);
    expect(formatNotificationBadgeCount(100)).toBe('99+');
    expect(getNotificationAnimationDelay(3)).toBe('0.15s');
  });

  it('recognizes keyboard activation keys', () => {
    expect(isNotificationActivationKey('Enter')).toBe(true);
    expect(isNotificationActivationKey(' ')).toBe(true);
    expect(isNotificationActivationKey('Escape')).toBe(false);
  });
});
