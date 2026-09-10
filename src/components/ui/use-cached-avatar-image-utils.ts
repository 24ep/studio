import type { MutableRefObject } from 'react';

import type {
  AvatarSize,
  CachedAvatarUser,
} from './use-cached-avatar-image';

export interface CachedAvatarIdentity {
  userId: string;
  avatarUrl?: string | null;
  image?: string | null;
}

export function shouldSkipCachedAvatarLoad(
  previous: CachedAvatarIdentity,
  next: CachedAvatarIdentity,
  forceRefresh: boolean
) {
  return !forceRefresh &&
    previous.userId === next.userId &&
    previous.avatarUrl === next.avatarUrl &&
    previous.image === next.image;
}

export function isSameCachedAvatarResource(
  previous: Pick<CachedAvatarIdentity, 'userId' | 'avatarUrl'>,
  next: Pick<CachedAvatarIdentity, 'userId' | 'avatarUrl'>
) {
  return previous.userId === next.userId &&
    getUrlPath(previous.avatarUrl) === getUrlPath(next.avatarUrl);
}

export function hasAvatarSource(user: CachedAvatarUser) {
  return Boolean(user.avatarUrl || user.image);
}

export function getAvatarInitials(name: string | undefined, fallback: string) {
  if (!name) return fallback;
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getAvatarTooltip(user: CachedAvatarUser, showTooltip: boolean) {
  if (!showTooltip) return undefined;
  return `${user.name || ''}${user.email ? ` (${user.email})` : ''}`;
}

export function getAvatarFallbackIconClass(size: AvatarSize) {
  if (size === 'xs') return 'h-2.5 w-2.5';
  if (size === 'sm') return 'h-3 w-3';
  if (size === 'md') return 'h-4 w-4';
  if (size === 'lg') return 'h-5 w-5';
  return 'h-6 w-6';
}

export function clearAvatarTimeout(timeoutRef: MutableRefObject<NodeJS.Timeout | null>) {
  if (!timeoutRef.current) {
    return;
  }

  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

function getUrlPath(url: string | null | undefined) {
  if (!url) return '';
  try {
    return new URL(url, 'http://d').pathname;
  } catch {
    return url;
  }
}
