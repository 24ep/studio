import { describe, expect, it, vi } from 'vitest';
import {
  cleanupServiceWorkerRecoveryAssets,
  getInitialFetchFailureState,
  getNextFetchFailureState,
  shouldAttemptServiceWorkerRecovery,
} from './service-worker-recovery-utils';

describe('service-worker-recovery-utils', () => {
  it('starts with no fetch failures', () => {
    expect(getInitialFetchFailureState()).toEqual({
      failureCount: 0,
      lastFailureTime: 0,
    });
  });

  it('increments failures inside the window and resets after the window', () => {
    const first = getNextFetchFailureState({
      previous: getInitialFetchFailureState(),
      now: 1000,
      failureWindowMs: 5000,
    });
    const second = getNextFetchFailureState({
      previous: first,
      now: 2000,
      failureWindowMs: 5000,
    });
    const reset = getNextFetchFailureState({
      previous: second,
      now: 8001,
      failureWindowMs: 5000,
    });

    expect(first.failureCount).toBe(1);
    expect(second.failureCount).toBe(2);
    expect(reset.failureCount).toBe(1);
  });

  it('attempts recovery only after enough failures and without session guards', () => {
    expect(
      shouldAttemptServiceWorkerRecovery({
        failureCount: 20,
        recoveryAttempted: false,
        hasRecoveredThisSession: false,
      })
    ).toBe(true);
    expect(
      shouldAttemptServiceWorkerRecovery({
        failureCount: 19,
        recoveryAttempted: false,
        hasRecoveredThisSession: false,
      })
    ).toBe(false);
    expect(
      shouldAttemptServiceWorkerRecovery({
        failureCount: 20,
        recoveryAttempted: true,
        hasRecoveredThisSession: false,
      })
    ).toBe(false);
    expect(
      shouldAttemptServiceWorkerRecovery({
        failureCount: 20,
        recoveryAttempted: false,
        hasRecoveredThisSession: true,
      })
    ).toBe(false);
  });

  it('cleans up service worker registrations and caches', async () => {
    const registrations = [
      { unregister: vi.fn().mockResolvedValue(true) },
      { unregister: vi.fn().mockResolvedValue(true) },
    ];
    const serviceWorker = {
      getRegistrations: vi.fn().mockResolvedValue(registrations),
    };
    const cacheStorage = {
      keys: vi.fn().mockResolvedValue(['app', 'images']),
      delete: vi.fn().mockResolvedValue(true),
    };

    await cleanupServiceWorkerRecoveryAssets({ serviceWorker, cacheStorage });

    expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(1);
    expect(registrations[0].unregister).toHaveBeenCalledTimes(1);
    expect(registrations[1].unregister).toHaveBeenCalledTimes(1);
    expect(cacheStorage.delete).toHaveBeenNthCalledWith(1, 'app');
    expect(cacheStorage.delete).toHaveBeenNthCalledWith(2, 'images');
  });

  it('allows cleanup when service worker or cache storage is unavailable', async () => {
    await expect(cleanupServiceWorkerRecoveryAssets({})).resolves.toBeUndefined();
  });
});
