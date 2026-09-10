import {
  addCacheBuster,
  getBestImageUrl,
} from './image-url-utils';
import {
  clearImageCache,
  isExternalImageUrl,
  preloadImage,
  refreshImage,
} from './image-browser-cache';

const avatarCache = new Map<string, {
  url: string;
  timestamp: number;
  promise: Promise<string>;
}>();

const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
type AvatarCacheOptions = { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; thumbnail?: boolean };
type AvatarUser = {
  id: string;
  avatarUrl?: string | null;
  image?: string | null;
};

export function resolveAvatarCacheOptions(options?: AvatarCacheOptions) {
  const sizeLevel = options?.size;
  const useThumbnail = options?.thumbnail ?? isThumbnailSize(sizeLevel);

  return {
    sizeLevel,
    useThumbnail,
  };
}

export function buildAvatarCacheKey(
  userId: string,
  imageUrl: string,
  useThumbnail: boolean,
  sizeLevel?: AvatarCacheOptions['size']
) {
  return `${userId}-${imageUrl}-${useThumbnail ? 'thumb' : 'full'}-${sizeLevel || 'auto'}`;
}

export function shouldRunAvatarCacheCleanup(now: number) {
  return now % 5000 === 0;
}

function isThumbnailSize(size?: AvatarCacheOptions['size']) {
  return size === 'xs' || size === 'sm' || size === 'md';
}

function cleanupCache(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, entry] of avatarCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => avatarCache.delete(key));

  if (avatarCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(avatarCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, avatarCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => avatarCache.delete(key));
  }
}

export const getCachedAvatarUrl = async (
  user: AvatarUser,
  forceRefresh: boolean = false,
  options?: AvatarCacheOptions
): Promise<string | null> => {
  const { sizeLevel, useThumbnail } = resolveAvatarCacheOptions(options);

  const imageUrl = getBestImageUrl(user, { thumbnail: useThumbnail });
  if (!imageUrl) return null;

  const cacheKey = buildAvatarCacheKey(user.id, imageUrl, useThumbnail, sizeLevel);
  const now = Date.now();

  if (shouldRunAvatarCacheCleanup(now)) {
    cleanupCache();
  }

  const cached = avatarCache.get(cacheKey);
  if (cached && !forceRefresh && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.url;
  }

  const cacheBustedUrl = addCacheBuster(imageUrl, forceRefresh);
  const preloadPromise = preloadImage(cacheBustedUrl).catch(error => {
    if (!isExternalImageUrl(imageUrl)) {
      console.warn('Failed to preload avatar:', error);
    }
    return imageUrl;
  });

  avatarCache.set(cacheKey, {
    url: cacheBustedUrl,
    timestamp: now,
    promise: preloadPromise,
  });

  return preloadPromise;
};

export const preloadAvatars = async (users: Array<{
  id: string;
  avatarUrl?: string | null;
  image?: string | null;
}>): Promise<void> => {
  const preloadPromises = users
    .filter(user => getBestImageUrl(user))
    .map(user => getCachedAvatarUrl(user).catch(() => null));

  await Promise.allSettled(preloadPromises);
};

export {
  clearImageCache,
  preloadImage,
  refreshImage,
};
