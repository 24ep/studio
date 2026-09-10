import { describe, expect, it } from 'vitest';

import {
  buildAvatarCacheKey,
  resolveAvatarCacheOptions,
  shouldRunAvatarCacheCleanup,
} from './image-avatar-cache';

describe('image avatar cache utilities', () => {
  it('resolves thumbnail cache options from size defaults and overrides', () => {
    expect(resolveAvatarCacheOptions({ size: 'xs' })).toEqual({
      sizeLevel: 'xs',
      useThumbnail: true,
    });
    expect(resolveAvatarCacheOptions({ size: 'lg' })).toEqual({
      sizeLevel: 'lg',
      useThumbnail: false,
    });
    expect(resolveAvatarCacheOptions({ size: 'lg', thumbnail: true })).toEqual({
      sizeLevel: 'lg',
      useThumbnail: true,
    });
    expect(resolveAvatarCacheOptions()).toEqual({
      sizeLevel: undefined,
      useThumbnail: false,
    });
  });

  it('builds stable avatar cache keys', () => {
    expect(buildAvatarCacheKey('user-1', '/avatar.png', true, 'sm'))
      .toBe('user-1-/avatar.png-thumb-sm');
    expect(buildAvatarCacheKey('user-1', '/avatar.png', false))
      .toBe('user-1-/avatar.png-full-auto');
  });

  it('throttles opportunistic cache cleanup by timestamp', () => {
    expect(shouldRunAvatarCacheCleanup(10_000)).toBe(true);
    expect(shouldRunAvatarCacheCleanup(10_001)).toBe(false);
  });
});
