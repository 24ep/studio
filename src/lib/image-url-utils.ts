import {
  parseImageUrlSafe,
  serializeParsedImageUrl,
} from './image-url-parsing-utils';
import {
  convertMinIOUrlToSecureUrl,
  type SecureUrlOptions,
} from './image-secure-url-utils';

export { parseImageUrlSafe } from './image-url-parsing-utils';
export { convertMinIOUrlToSecureUrl };
export type { SecureUrlOptions };

function createRandomCacheBusterSegment() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 13);
  }

  return Math.random().toString(36).substring(2, 15);
}

function createCacheBusterValue() {
  const timestamp = Date.now();
  return `${timestamp}-${createRandomCacheBusterSegment()}`;
}

export const addCacheBuster = (url: string, forceRefresh: boolean = false): string => {
  if (!url) return url;

  const parsed = parseImageUrlSafe(url);
  if (!parsed) return url;

  try {
    if (forceRefresh) {
      parsed.urlObj.searchParams.set('cb', createCacheBusterValue());
    } else if (!parsed.urlObj.searchParams.has('cb')) {
      parsed.urlObj.searchParams.set('cb', '1');
    }

    return serializeParsedImageUrl(url, parsed);
  } catch (error) {
    console.warn('Error during image URL cache busting:', url, error);
    return url;
  }
};

export const removeCacheBuster = (url: string): string => {
  if (!url) return url;

  const parsed = parseImageUrlSafe(url);
  if (!parsed) return url;

  try {
    parsed.urlObj.searchParams.delete('cb');
    return serializeParsedImageUrl(url, parsed);
  } catch (error) {
    console.warn('Error during image URL cache buster removal:', url, error);
    return url;
  }
};

export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;

  const parsed = parseImageUrlSafe(url);
  if (!parsed) return false;

  const pathname = parsed.urlObj.pathname.toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => pathname.endsWith(ext));
};

export const getBestImageUrl = (user: {
  avatarUrl?: string | null;
  image?: string | null;
}, options?: SecureUrlOptions): string | null => {
  const url = user.avatarUrl || user.image || null;
  return url ? convertMinIOUrlToSecureUrl(url, options) : null;
};

export const getCacheBustedImageUrl = (
  user: {
    avatarUrl?: string | null;
    image?: string | null;
  },
  forceRefresh: boolean = false
): string | null => {
  const imageUrl = getBestImageUrl(user);
  return imageUrl ? addCacheBuster(imageUrl, forceRefresh) : null;
};
