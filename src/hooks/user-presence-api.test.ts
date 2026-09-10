import { describe, expect, it, vi } from 'vitest';

import {
  canSyncUserPresence,
  fetchOnlineUserPresence,
  removeCurrentUserPresence,
  updateCurrentUserPresence,
} from './user-presence-api';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('user-presence-api', () => {
  it('builds update and remove requests for signed-in users', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ ok: true })) as unknown as typeof fetch;

    await expect(updateCurrentUserPresence({
      id: 'user-1',
      name: null,
      email: 'ada@example.test',
      role: null,
      avatarUrl: '/avatar.png',
      personalColor: '#123456',
    }, '/dashboard', fetcher)).resolves.toBe(true);

    expect(fetcher).toHaveBeenCalledWith('/api/realtime/presence', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-1',
        userName: 'ada@example.test',
        userRole: 'User',
        avatarUrl: '/avatar.png',
        personalColor: '#123456',
        currentPage: '/dashboard',
      }),
    }));

    await expect(removeCurrentUserPresence('user-1', fetcher)).resolves.toBe(true);
    expect(fetcher).toHaveBeenLastCalledWith('/api/realtime/presence', expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ userId: 'user-1' }),
    }));
  });

  it('skips presence sync without a user id', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;

    expect(canSyncUserPresence({ id: null })).toBe(false);
    await expect(updateCurrentUserPresence({ id: null }, '/dashboard', fetcher)).resolves.toBe(false);
    await expect(removeCurrentUserPresence(null, fetcher)).resolves.toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches and validates online user presence rows', async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      users: [
        {
          userId: 'user-1',
          userName: 'Ada',
          userRole: 'Admin',
          currentPage: '/dashboard',
          lastSeen: '2026-06-10T00:00:00.000Z',
          isOnline: true,
        },
        { userId: 'invalid' },
      ],
    })) as unknown as typeof fetch;

    await expect(fetchOnlineUserPresence('user-1', fetcher)).resolves.toEqual([
      {
        userId: 'user-1',
        userName: 'Ada',
        userRole: 'Admin',
        currentPage: '/dashboard',
        lastSeen: '2026-06-10T00:00:00.000Z',
        isOnline: true,
      },
    ]);
  });

  it('surfaces presence fetch failures', async () => {
    const fetcher = vi.fn(async () => new Response('Nope', { status: 500 })) as unknown as typeof fetch;

    await expect(fetchOnlineUserPresence('user-1', fetcher)).rejects.toThrow(
      'Failed to fetch presence data: 500 Nope'
    );
  });
});
