export const SW_VERSION = '2.1.3';
export const SW_VERSION_KEY = 'sw-version';
export const SW_REGISTRATION_DELAY_MS = 1000;
export const SW_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

export function hasServiceWorkerSupport() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function shouldCleanupServiceWorkers({
  storedVersion,
  currentVersion = SW_VERSION,
  nodeEnv,
}: {
  storedVersion: string | null;
  currentVersion?: string;
  nodeEnv: string | undefined;
}) {
  return storedVersion !== currentVersion || nodeEnv !== 'production';
}

export function shouldUnregisterServiceWorkers({
  pwaEnabled,
  nodeEnv,
}: {
  pwaEnabled: boolean;
  nodeEnv: string | undefined;
}) {
  return nodeEnv !== 'production' || !pwaEnabled;
}

export function shouldRegisterServiceWorker({
  pwaEnabled,
  nodeEnv,
  serviceWorkerSupported,
}: {
  pwaEnabled: boolean;
  nodeEnv: string | undefined;
  serviceWorkerSupported: boolean;
}) {
  return pwaEnabled && nodeEnv === 'production' && serviceWorkerSupported;
}

export async function unregisterServiceWorkerRegistrations(
  registrations: ReadonlyArray<Pick<ServiceWorkerRegistration, 'unregister'>>
) {
  for (const registration of registrations) {
    await registration.unregister();
  }
}

export async function clearServiceWorkerCaches(cacheStorage: Pick<CacheStorage, 'keys' | 'delete'>) {
  const cacheNames = await cacheStorage.keys();

  for (const cacheName of cacheNames) {
    await cacheStorage.delete(cacheName);
  }
}
