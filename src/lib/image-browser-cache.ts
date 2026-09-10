import { addCacheBuster } from './image-url-utils';

export function isExternalImageUrl(url: string): boolean {
  if (!url || typeof window === 'undefined') return false;

  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export const preloadImage = (url: string, timeout: number = 15000): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }

    const img = new Image();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve(url);
    };

    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to preload image: ${url}`));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Image preload timeout: ${url}`));
    }, timeout);

    img.src = url;
  });
};

export const clearImageCache = (url: string): void => {
  if (!url || typeof window === 'undefined') return;

  try {
    const img = new Image();
    img.src = addCacheBuster(url, true);
    void deleteFromBrowserImageCaches([url]);
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
};

export const refreshImage = async (url: string): Promise<void> => {
  if (!url) return;

  try {
    clearImageCache(url);
    const cacheBustedUrl = addCacheBuster(url, true);
    await preloadImage(cacheBustedUrl);
    await deleteFromBrowserImageCaches([url, cacheBustedUrl]);
  } catch (error) {
    console.warn('Failed to refresh image:', error);
  }
};

async function deleteFromBrowserImageCaches(urls: string[]) {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => deleteUrlsFromCache(cacheName, urls)));
  } catch (cacheError) {
    console.warn('Failed to clear browser cache:', cacheError);
  }
}

async function deleteUrlsFromCache(cacheName: string, urls: string[]) {
  const cache = await caches.open(cacheName);
  await Promise.all(urls.map((url) => cache.delete(url)));
}
