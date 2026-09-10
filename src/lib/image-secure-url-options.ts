import type {
  NormalizedSecureImageOptions,
  SecureUrlOptions,
} from './image-secure-url-types';

export function normalizeSecureImageOptions(options: boolean | SecureUrlOptions): NormalizedSecureImageOptions {
  return {
    isPublic: typeof options === 'boolean' ? options : options.isPublic || false,
    thumbnail: typeof options === 'object' ? options.thumbnail : false,
    width: typeof options === 'object' ? options.width : undefined,
    height: typeof options === 'object' ? options.height : undefined,
  };
}
