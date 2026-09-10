import {
  clearServiceWorkerCaches,
  unregisterServiceWorkerRegistrations,
} from './service-worker-registration-utils';

export const SW_RECOVERY_KEY = 'sw_recovery_attempted';
export const SW_RECOVERY_MAX_FAILURES = 20;
export const SW_RECOVERY_FAILURE_WINDOW_MS = 60000;
export const SW_RECOVERY_RELOAD_DELAY_MS = 1500;

export interface FetchFailureState {
  failureCount: number;
  lastFailureTime: number;
}

export function getInitialFetchFailureState(): FetchFailureState {
  return {
    failureCount: 0,
    lastFailureTime: 0,
  };
}

export function getNextFetchFailureState({
  previous,
  now,
  failureWindowMs = SW_RECOVERY_FAILURE_WINDOW_MS,
}: {
  previous: FetchFailureState;
  now: number;
  failureWindowMs?: number;
}): FetchFailureState {
  const failureCount = now - previous.lastFailureTime > failureWindowMs
    ? 1
    : previous.failureCount + 1;

  return {
    failureCount,
    lastFailureTime: now,
  };
}

export function shouldAttemptServiceWorkerRecovery({
  failureCount,
  recoveryAttempted,
  hasRecoveredThisSession,
  maxFailures = SW_RECOVERY_MAX_FAILURES,
}: {
  failureCount: number;
  recoveryAttempted: boolean;
  hasRecoveredThisSession: boolean;
  maxFailures?: number;
}) {
  return failureCount >= maxFailures && !recoveryAttempted && !hasRecoveredThisSession;
}

export async function cleanupServiceWorkerRecoveryAssets({
  serviceWorker,
  cacheStorage,
}: {
  serviceWorker?: Pick<ServiceWorkerContainer, 'getRegistrations'> | null;
  cacheStorage?: Pick<CacheStorage, 'keys' | 'delete'> | null;
}) {
  if (serviceWorker) {
    const registrations = await serviceWorker.getRegistrations();
    await unregisterServiceWorkerRegistrations(registrations);
  }

  if (cacheStorage) {
    await clearServiceWorkerCaches(cacheStorage);
  }
}
