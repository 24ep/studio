import { describe, expect, it, vi } from 'vitest';
import {
  clearBrowserStorage,
  clearCacheStorage,
  clearIndexedDatabases,
  clearWebStorage,
  unregisterServiceWorkers,
} from './browser-storage-cleanup';

describe('browser-storage-cleanup', () => {
  it('clears web storage when provided', async () => {
    const storage = { clear: vi.fn() };

    await clearWebStorage(storage);
    await clearWebStorage(null);

    expect(storage.clear).toHaveBeenCalledTimes(1);
  });

  it('deletes every cache storage entry', async () => {
    const cacheStorage = {
      keys: vi.fn().mockResolvedValue(['app', 'images']),
      delete: vi.fn().mockResolvedValue(true),
    };

    await clearCacheStorage(cacheStorage);

    expect(cacheStorage.keys).toHaveBeenCalledTimes(1);
    expect(cacheStorage.delete).toHaveBeenNthCalledWith(1, 'app');
    expect(cacheStorage.delete).toHaveBeenNthCalledWith(2, 'images');
  });

  it('unregisters every service worker registration', async () => {
    const registrations = [
      { unregister: vi.fn().mockResolvedValue(true) },
      { unregister: vi.fn().mockResolvedValue(true) },
    ];
    const serviceWorker = {
      getRegistrations: vi.fn().mockResolvedValue(registrations),
    };

    await unregisterServiceWorkers(serviceWorker);

    expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(1);
    expect(registrations[0].unregister).toHaveBeenCalledTimes(1);
    expect(registrations[1].unregister).toHaveBeenCalledTimes(1);
  });

  it('deletes named IndexedDB databases and skips nameless entries', async () => {
    type FakeDeleteRequest = { onsuccess?: () => void; onerror?: () => void; error?: Error };
    const deleteRequests: FakeDeleteRequest[] = [];
    const indexedDB = {
      databases: vi.fn().mockResolvedValue([{ name: 'app-db' }, { name: '' }]),
      deleteDatabase: vi.fn().mockImplementation(() => {
        const request: FakeDeleteRequest = {};
        deleteRequests.push(request);
        queueMicrotask(() => request.onsuccess?.());
        return request;
      }),
    };

    await clearIndexedDatabases(indexedDB as unknown as Pick<IDBFactory, 'databases' | 'deleteDatabase'>);

    expect(indexedDB.databases).toHaveBeenCalledTimes(1);
    expect(indexedDB.deleteDatabase).toHaveBeenCalledTimes(1);
    expect(indexedDB.deleteDatabase).toHaveBeenCalledWith('app-db');
  });

  it('clears browser storage categories in order', async () => {
    const localStorage = { clear: vi.fn() };
    const sessionStorage = { clear: vi.fn() };
    const cacheStorage = {
      keys: vi.fn().mockResolvedValue(['app']),
      delete: vi.fn().mockResolvedValue(true),
    };
    const serviceWorker = {
      getRegistrations: vi.fn().mockResolvedValue([{ unregister: vi.fn().mockResolvedValue(true) }]),
    };

    await clearBrowserStorage({
      localStorage,
      sessionStorage,
      cacheStorage,
      serviceWorker,
    });

    expect(localStorage.clear).toHaveBeenCalledTimes(1);
    expect(sessionStorage.clear).toHaveBeenCalledTimes(1);
    expect(cacheStorage.delete).toHaveBeenCalledWith('app');
    expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(1);
  });
});
