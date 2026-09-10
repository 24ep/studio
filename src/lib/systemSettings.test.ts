import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cacheCalls: vi.fn(),
  query: vi.fn(),
}));

vi.mock('next/cache', () => ({
  unstable_cache: (callback: (...args: unknown[]) => unknown) => (...args: unknown[]) => {
    mocks.cacheCalls(...args);
    return callback(...args);
  },
}));

vi.mock('@/lib/db', () => ({
  getPool: () => ({ query: mocks.query }),
}));

import { getSystemSetting } from './systemSettings';

describe('getSystemSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue({ rows: [{ key: 'setting', value: 'configured' }] });
  });

  it('reads AppKit configuration directly so stale missing values are not cached', async () => {
    await expect(getSystemSetting('appkitApiKey')).resolves.toBe('configured');

    expect(mocks.cacheCalls).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenCalledWith(
      'SELECT key, value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
      ['appkitApiKey'],
    );
  });

  it('continues to use the shared cache for ordinary settings', async () => {
    await expect(getSystemSetting('defaultMatchCriteria')).resolves.toBe('configured');

    expect(mocks.cacheCalls).toHaveBeenCalledWith('defaultMatchCriteria');
  });
});
