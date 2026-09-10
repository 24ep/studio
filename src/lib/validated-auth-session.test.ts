import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: authMock,
}));

import { getValidatedAuthSession } from './validated-auth-session';

describe('getValidatedAuthSession', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('returns a session only when it has a user id', async () => {
    const session = { user: { id: 'user-1', role: 'Employee' } };
    authMock.mockResolvedValue(session);

    await expect(getValidatedAuthSession()).resolves.toBe(session);
  });

  it.each([null, {}, { message: 'Authentication failed' }, { user: {} }])(
    'normalizes an invalid auth result to null',
    async (value) => {
      authMock.mockResolvedValue(value);

      await expect(getValidatedAuthSession()).resolves.toBeNull();
    },
  );

  it('normalizes auth failures to null', async () => {
    authMock.mockRejectedValue(new Error('Auth unavailable'));

    await expect(getValidatedAuthSession()).resolves.toBeNull();
  });
});
