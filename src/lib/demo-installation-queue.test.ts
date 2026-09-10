import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  default: { systemSetting: { findUnique: mocks.findUnique } },
}));
vi.mock('@/lib/db', () => ({ getPool: vi.fn() }));
vi.mock('@/lib/demo-installation', () => ({ initializeInstallationEnvironment: vi.fn() }));

import { assertInstallationOwner } from './demo-installation-queue';

describe('demo installation lifecycle guard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows the administrator who created an unfinished installation', async () => {
    mocks.findUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      Promise.resolve(where.key === 'platformInstalledByUserId' ? { value: 'admin-1' } : null));
    await expect(assertInstallationOwner('admin-1')).resolves.toBeUndefined();
  });

  it('rejects a different administrator', async () => {
    mocks.findUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      Promise.resolve(where.key === 'platformInstalledByUserId' ? { value: 'admin-1' } : null));
    await expect(assertInstallationOwner('admin-2')).rejects.toThrow('Only the administrator');
  });

  it('rejects every repeat initialization after setup is complete', async () => {
    mocks.findUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      Promise.resolve(where.key === 'installationEnvironmentConfiguredAt' ? { value: new Date().toISOString() } : { value: 'admin-1' }));
    await expect(assertInstallationOwner('admin-1')).rejects.toThrow('already been configured');
  });
});
