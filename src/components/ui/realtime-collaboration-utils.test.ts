import { describe, expect, it, vi } from 'vitest';
import {
  formatTimestamp,
  getUserInitials,
  normalizeRealtimeNotification,
  normalizeRealtimeNotifications,
} from './realtime-collaboration-utils';

describe('realtime-collaboration-utils', () => {
  it('normalizes notification records with fallbacks', () => {
    expect(normalizeRealtimeNotification({
      id: 123,
      createdAt: '2026-06-09T00:00:00.000Z',
    })).toMatchObject({
      id: '123',
      title: 'Untitled Notification',
      message: 'No message',
      timestamp: '2026-06-09T00:00:00.000Z',
      read: false,
    });

    expect(normalizeRealtimeNotification(null)).toBeNull();
    expect(normalizeRealtimeNotification({ title: 'Missing id' })).toBeNull();
  });

  it('normalizes notification arrays and rejects invalid payloads', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(normalizeRealtimeNotifications([
      { id: 'a', title: 'A', message: 'Message', timestamp: 1, read: true },
      { title: 'invalid' },
    ])).toHaveLength(1);

    expect(normalizeRealtimeNotifications({ id: 'not-array' })).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('formats timestamps and initials', () => {
    expect(formatTimestamp(null)).toBe('Unknown time');
    expect(formatTimestamp('not-a-date')).toBe('Unknown time');
    expect(getUserInitials('Ada Lovelace')).toBe('AL');
    expect(getUserInitials('Grace')).toBe('G');
  });
});
