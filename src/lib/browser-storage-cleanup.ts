export interface BrowserStorageCleanupOptions {
  localStorage?: Pick<Storage, 'clear'> | null;
  sessionStorage?: Pick<Storage, 'clear'> | null;
  indexedDB?: Pick<IDBFactory, 'databases' | 'deleteDatabase'> | null;
  serviceWorker?: Pick<ServiceWorkerContainer, 'getRegistrations'> | null;
  cacheStorage?: Pick<CacheStorage, 'keys' | 'delete'> | null;
}

export async function clearWebStorage(storage?: Pick<Storage, 'clear'> | null) {
  storage?.clear();
}

export async function clearCacheStorage(cacheStorage?: Pick<CacheStorage, 'keys' | 'delete'> | null) {
  if (!cacheStorage) return;

  const cacheNames = await cacheStorage.keys();
  await Promise.all(cacheNames.map(cacheName => cacheStorage.delete(cacheName)));
}

export async function unregisterServiceWorkers(
  serviceWorker?: Pick<ServiceWorkerContainer, 'getRegistrations'> | null
) {
  if (!serviceWorker) return;

  const registrations = await serviceWorker.getRegistrations();
  await Promise.all(registrations.map(registration => registration.unregister()));
}

export async function clearIndexedDatabases(indexedDB?: Pick<IDBFactory, 'databases' | 'deleteDatabase'> | null) {
  if (!indexedDB?.databases) return;

  const databases = await indexedDB.databases();
  await Promise.all(
    databases.map(database => {
      if (!database.name) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(database.name || '');
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    })
  );
}

export async function clearBrowserStorage({
  localStorage,
  sessionStorage,
  indexedDB,
  serviceWorker,
  cacheStorage,
}: BrowserStorageCleanupOptions) {
  await clearWebStorage(localStorage);
  await clearWebStorage(sessionStorage);
  await clearIndexedDatabases(indexedDB);
  await clearCacheStorage(cacheStorage);
  await unregisterServiceWorkers(serviceWorker);
}
