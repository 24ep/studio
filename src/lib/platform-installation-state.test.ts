import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ count: vi.fn(), findUnique: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: {
  user: { count: mocks.count }, systemSetting: { findUnique: mocks.findUnique },
} }));

import { isPlatformSetupRequired } from './platform-installation';

describe('platform setup lifecycle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires setup when no administrator exists', async () => {
    mocks.count.mockResolvedValue(0);
    mocks.findUnique.mockResolvedValue(null);
    await expect(isPlatformSetupRequired()).resolves.toBe(true);
  });

  it('keeps a new installation in setup until its environment is configured', async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findUnique.mockImplementation(({ where }: { where: { key: string } }) => Promise.resolve(
      where.key === 'platformInstalledByUserId' ? { value: 'admin-1' } : null,
    ));
    await expect(isPlatformSetupRequired()).resolves.toBe(true);
  });

  it('does not lock legacy installations that predate the environment step', async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findUnique.mockResolvedValue(null);
    await expect(isPlatformSetupRequired()).resolves.toBe(false);
  });

  it('closes setup after the environment is configured', async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findUnique.mockImplementation(({ where }: { where: { key: string } }) => Promise.resolve(
      where.key === 'platformInstalledByUserId' ? { value: 'admin-1' } : { value: new Date().toISOString() },
    ));
    await expect(isPlatformSetupRequired()).resolves.toBe(false);
  });
});
