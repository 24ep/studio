import { getImageUrlBase, parseImageUrlSafe } from './image-url-parsing-utils';
import {
  appendSecureImageParams,
  copySecureImageParams,
} from './image-secure-url-params';
import { isPublicLogoFilePath } from './image-secure-url-public-logo';
import type { NormalizedSecureImageOptions } from './image-secure-url-types';

function buildPublicLogoUrl(filePath: string) {
  const publicUrl = new URL('/api/public/logo', getImageUrlBase());
  publicUrl.searchParams.set('filePath', filePath);
  return publicUrl;
}

export function convertSecureFileUrlToPublicUrl(
  url: string,
  options: NormalizedSecureImageOptions
) {
  const parsed = parseImageUrlSafe(url);
  if (!parsed) return null;

  const filePath = parsed.urlObj.searchParams.get('filePath');
  if (!filePath || !isPublicLogoFilePath(filePath)) {
    return null;
  }

  const publicUrl = buildPublicLogoUrl(filePath);
  copySecureImageParams(publicUrl, parsed.urlObj, options);

  return publicUrl.toString();
}

export function convertMinioBucketPathToEndpoint(
  filePath: string,
  options: NormalizedSecureImageOptions
) {
  if (options.isPublic && isPublicLogoFilePath(filePath)) {
    return appendSecureImageParams(buildPublicLogoUrl(filePath).toString(), options);
  }

  return appendSecureImageParams(
    `/api/secure-file/preview?filePath=${encodeURIComponent(filePath)}`,
    options
  );
}
