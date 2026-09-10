import { describe, expect, it } from 'vitest';

import {
  getAvatarFallbackIconClass,
  getAvatarInitials,
  getAvatarTooltip,
  hasAvatarSource,
  isSameCachedAvatarResource,
  shouldSkipCachedAvatarLoad,
} from './use-cached-avatar-image-utils';

describe('use-cached-avatar-image-utils', () => {
  it('detects avatar sources and load skip conditions', () => {
    expect(hasAvatarSource({ id: 'user-1', avatarUrl: '/avatar.png' })).toBe(true);
    expect(hasAvatarSource({ id: 'user-1' })).toBe(false);

    const previous = { userId: 'user-1', avatarUrl: '/avatar.png', image: null };
    expect(shouldSkipCachedAvatarLoad(previous, previous, false)).toBe(true);
    expect(shouldSkipCachedAvatarLoad(previous, previous, true)).toBe(false);
    expect(shouldSkipCachedAvatarLoad(previous, { ...previous, image: '/image.png' }, false)).toBe(false);
  });

  it('compares avatar resources by user id and URL path', () => {
    expect(isSameCachedAvatarResource(
      { userId: 'user-1', avatarUrl: 'https://cdn.example.test/a.png?v=1' },
      { userId: 'user-1', avatarUrl: 'https://app.example.test/a.png?v=2' }
    )).toBe(true);

    expect(isSameCachedAvatarResource(
      { userId: 'user-1', avatarUrl: '/a.png' },
      { userId: 'user-2', avatarUrl: '/a.png' }
    )).toBe(false);
  });

  it('builds avatar display helper values', () => {
    expect(getAvatarInitials('Ada Lovelace', '?')).toBe('AL');
    expect(getAvatarInitials('Grace', '?')).toBe('G');
    expect(getAvatarInitials(undefined, '?')).toBe('?');

    expect(getAvatarTooltip({ id: '1', name: 'Ada', email: 'ada@example.test' }, true))
      .toBe('Ada (ada@example.test)');
    expect(getAvatarTooltip({ id: '1', name: 'Ada' }, false)).toBeUndefined();

    expect(getAvatarFallbackIconClass('xs')).toBe('h-2.5 w-2.5');
    expect(getAvatarFallbackIconClass('xl')).toBe('h-6 w-6');
  });
});
