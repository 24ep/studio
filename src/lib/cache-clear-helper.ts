import {
  clearCacheStorage,
  clearIndexedDatabases,
  clearWebStorage,
  unregisterServiceWorkers,
} from './browser-storage-cleanup';

export interface CacheClearOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearIndexedDB?: boolean;
  clearServiceWorkers?: boolean;
  clearCacheStorage?: boolean;
}

export class CacheClearHelper {
  static async clearAll(options: CacheClearOptions = {}): Promise<void> {
    const {
      clearLocalStorage = true,
      clearSessionStorage = true,
      clearIndexedDB = true,
      clearServiceWorkers = true,
      clearCacheStorage: shouldClearCacheStorage = true,
    } = options;

    try {
      if (clearLocalStorage && typeof window !== 'undefined' && window.localStorage) {
        await clearWebStorage(window.localStorage);
      }

      if (clearSessionStorage && typeof window !== 'undefined' && window.sessionStorage) {
        await clearWebStorage(window.sessionStorage);
      }

      if (clearIndexedDB && typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          await clearIndexedDatabases(indexedDB);
        } catch (error) {
          console.warn('Could not clear IndexedDB:', error);
        }
      }

      if (shouldClearCacheStorage && typeof window !== 'undefined' && 'caches' in window) {
        try {
          await clearCacheStorage(caches);
        } catch (error) {
          console.warn('Could not clear Cache Storage:', error);
        }
      }

      if (clearServiceWorkers && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          await unregisterServiceWorkers(navigator.serviceWorker);
        } catch (error) {
          console.warn('Could not clear Service Workers:', error);
        }
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
      throw error;
    }
  }

  static async clearAndReload(options: CacheClearOptions = {}): Promise<void> {
    try {
      await this.clearAll(options);

      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error during cache clear and reload:', error);
      window.location.reload();
    }
  }

  static isInitializationError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('cannot access') ||
      message.includes('before initialization') ||
      message.includes('is not defined') ||
      message.includes('temporal dead zone') ||
      message.includes('tg') ||
      message.includes('ee')
    );
  }

  static getErrorMessage(error: Error): string {
    if (this.isInitializationError(error)) {
      return 'A JavaScript initialization error occurred. This is usually caused by cached files that are out of sync.';
    }
    return 'An unexpected error occurred.';
  }

  static getRecommendedActions(): string[] {
    return [
      'Try refreshing the page to reload the JavaScript bundle',
      'Clear your browser cache and reload',
      'Check your internet connection',
      'Try using a different browser or incognito mode',
      'Disable browser extensions temporarily',
    ];
  }
}

export default CacheClearHelper;
