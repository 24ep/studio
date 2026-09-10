import { getImageUrlBase } from './image-url-parsing-utils';
import type { SecureUrlOptions } from './image-secure-url-types';

type SecureImageParamOptions = Pick<SecureUrlOptions, 'thumbnail' | 'width' | 'height'>;

export function applySecureImageParams(
  url: URL,
  options: SecureImageParamOptions
) {
  const paramEntries = [
    ['thumbnail', options.thumbnail ? 'true' : undefined],
    ['width', options.width ? String(options.width) : undefined],
    ['height', options.height ? String(options.height) : undefined],
  ] as const;

  for (const [key, value] of paramEntries) {
    if (value && !url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
}

export function appendSecureImageParams(
  baseUrl: string,
  options: SecureImageParamOptions
) {
  const url = new URL(baseUrl, getImageUrlBase());
  applySecureImageParams(url, options);

  return baseUrl.startsWith('http') ? url.toString() : url.pathname + url.search;
}

export function copySecureImageParams(
  target: URL,
  source: URL,
  options: SecureImageParamOptions
) {
  applySecureImageParams(target, {
    thumbnail: options.thumbnail || source.searchParams.get('thumbnail') === 'true',
    width: options.width || Number(source.searchParams.get('width')) || undefined,
    height: options.height || Number(source.searchParams.get('height')) || undefined,
  });
}
