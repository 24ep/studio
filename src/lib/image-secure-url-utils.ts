import {
  parseImageUrlSafe,
} from './image-url-parsing-utils';
import {
  convertMinioBucketPathToEndpoint,
  convertSecureFileUrlToPublicUrl,
} from './image-secure-url-converters';
import { normalizeSecureImageOptions } from './image-secure-url-options';
import { appendSecureImageParams } from './image-secure-url-params';
import { hasDangerousImageProtocol } from './image-secure-url-safety';
import type { SecureUrlOptions } from './image-secure-url-types';

export type { SecureUrlOptions } from './image-secure-url-types';

function convertExistingSecureFileUrl(
  url: string,
  options: ReturnType<typeof normalizeSecureImageOptions>
) {
  if (url.startsWith('http')) {
    const urlObj = new URL(url);
    return appendSecureImageParams(urlObj.pathname + urlObj.search, options);
  }

  return appendSecureImageParams(url, options);
}

export const convertMinIOUrlToSecureUrl = (
  url: string | null,
  options: boolean | SecureUrlOptions = false
): string | null => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  const normalizedOptions = normalizeSecureImageOptions(options);

  try {
    if (url.includes('/api/public/')) return url;

    if (normalizedOptions.isPublic && url.includes('/api/secure-file/')) {
      const publicUrl = convertSecureFileUrlToPublicUrl(url, normalizedOptions);
      if (publicUrl) return publicUrl;
    }

    if (url.includes('/api/secure-file/')) {
      return convertExistingSecureFileUrl(url, normalizedOptions);
    }

    const parsed = parseImageUrlSafe(url);
    if (!parsed) return url;

    const bucketMatch = parsed.urlObj.pathname.match(/\/studio-production\/(.+)$/);
    if (bucketMatch) {
      return convertMinioBucketPathToEndpoint(bucketMatch[1], normalizedOptions);
    }

    return hasDangerousImageProtocol(url) ? null : url;
  } catch (error) {
    if (hasDangerousImageProtocol(url)) return null;
    console.warn('Failed to convert MinIO URL to secure URL:', url, error);
    return url;
  }
};
