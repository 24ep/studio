import { describe, expect, it, vi } from 'vitest';
import {
  clearServiceWorkerCaches,
  shouldCleanupServiceWorkers,
  shouldRegisterServiceWorker,
  shouldUnregisterServiceWorkers,
  SW_VERSION,
  unregisterServiceWorkerRegistrations,
} from './service-worker-registration-utils';

describe('service-worker-registration-utils', () => {
  it('cleans up service workers when the stored version changes or outside production', () => {
    expect(
      shouldCleanupServiceWorkers({
        storedVersion: 'old',
        currentVersion: SW_VERSION,
        nodeEnv: 'production',
      })
    ).toBe(true);
    expect(
      shouldCleanupServiceWorkers({
        storedVersion: SW_VERSION,
        currentVersion: SW_VERSION,
        nodeEnv: 'development',
      })
    ).toBe(true);
    expect(
      shouldCleanupServiceWorkers({
        storedVersion: SW_VERSION,
        currentVersion: SW_VERSION,
        nodeEnv: 'production',
      })
    ).toBe(false);
  });

  it('unregisters in development or when PWA is disabled', () => {
    expect(shouldUnregisterServiceWorkers({ pwaEnabled: true, nodeEnv: 'development' })).toBe(true);
    expect(shouldUnregisterServiceWorkers({ pwaEnabled: false, nodeEnv: 'production' })).toBe(true);
    expect(shouldUnregisterServiceWorkers({ pwaEnabled: true, nodeEnv: 'production' })).toBe(false);
  });

  it('registers only when production, enabled, and supported', () => {
    expect(
      shouldRegisterServiceWorker({
        pwaEnabled: true,
        nodeEnv: 'production',
        serviceWorkerSupported: true,
      })
    ).toBe(true);
    expect(
      shouldRegisterServiceWorker({
        pwaEnabled: true,
        nodeEnv: 'test',
        serviceWorkerSupported: true,
      })
    ).toBe(false);
    expect(
      shouldRegisterServiceWorker({
        pwaEnabled: true,
        nodeEnv: 'production',
        serviceWorkerSupported: false,
      })
    ).toBe(false);
  });

  it('unregisters every existing registration', async () => {
    const registrations = [
      { unregister: vi.fn().mockResolvedValue(true) },
      { unregister: vi.fn().mockResolvedValue(true) },
    ];

    await unregisterServiceWorkerRegistrations(registrations);

    expect(registrations[0].unregister).toHaveBeenCalledTimes(1);
    expect(registrations[1].unregister).toHaveBeenCalledTimes(1);
  });

  it('clears all named caches', async () => {
    const cacheStorage = {
      keys: vi.fn().mockResolvedValue(['v1', 'images']),
      delete: vi.fn().mockResolvedValue(true),
    };

    await clearServiceWorkerCaches(cacheStorage);

    expect(cacheStorage.keys).toHaveBeenCalledTimes(1);
    expect(cacheStorage.delete).toHaveBeenNthCalledWith(1, 'v1');
    expect(cacheStorage.delete).toHaveBeenNthCalledWith(2, 'images');
  });
});
