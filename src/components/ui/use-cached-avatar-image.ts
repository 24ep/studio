import { useEffect, useRef, useState } from 'react';
import { getCachedAvatarUrl } from '@/lib/imageUtils';

import {
  clearAvatarTimeout,
  getAvatarFallbackIconClass,
  getAvatarInitials,
  getAvatarTooltip,
  hasAvatarSource,
  isSameCachedAvatarResource,
  shouldSkipCachedAvatarLoad,
} from './use-cached-avatar-image-utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CachedAvatarUser {
  id: string;
  name?: string;
  avatarUrl?: string | null;
  image?: string | null;
  email?: string;
  personalColor?: string | null;
}

export {
  getAvatarFallbackIconClass,
  getAvatarInitials,
  getAvatarTooltip,
};

interface UseCachedAvatarImageOptions {
  forceRefresh?: boolean;
  size?: AvatarSize;
  warningLabel: string;
}

export function useCachedAvatarImage(
  user: CachedAvatarUser,
  { forceRefresh = false, size, warningLabel }: UseCachedAvatarImageOptions
) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => hasAvatarSource(user));
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMountedRef = useRef(true);
  const lastUserIdRef = useRef<string | null>(null);
  const lastAvatarUrlRef = useRef<string | null | undefined>(null);
  const lastImageRef = useRef<string | null | undefined>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userId = user.id;
  const avatarUrl = user.avatarUrl;
  const image = user.image;

  useEffect(() => {
    const previousAvatar = {
      userId: lastUserIdRef.current || '',
      avatarUrl: lastAvatarUrlRef.current,
      image: lastImageRef.current,
    };
    const nextAvatar = { userId, avatarUrl, image };

    if (shouldSkipCachedAvatarLoad(previousAvatar, nextAvatar, forceRefresh)) {
      return undefined;
    }

    const isSameResource = isSameCachedAvatarResource(previousAvatar, nextAvatar);

    lastUserIdRef.current = userId;
    lastAvatarUrlRef.current = avatarUrl;
    lastImageRef.current = image;
    isMountedRef.current = true;

    if (!avatarUrl && !image) {
      if (isMountedRef.current) {
        setImageUrl(null);
        setIsLoading(false);
        setImageLoaded(false);
      }
      return cleanupAvatarLoad;
    }

    let isCancelled = false;

    async function loadAvatar() {
      try {
        if (isMountedRef.current && !isCancelled && !isSameResource) {
          setIsLoading(true);
          setImageLoaded(false);
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Avatar loading timeout'));
          }, 10000);
        });

        const avatarPromise = getCachedAvatarUrl({ id: userId, avatarUrl, image }, forceRefresh, { size });
        const cachedUrl = await Promise.race([avatarPromise, timeoutPromise]);

        if (isMountedRef.current && !isCancelled) {
          setImageUrl(cachedUrl);
        }
      } catch (error) {
        console.warn(`[${warningLabel}] Failed to load avatar:`, error);
        if (isMountedRef.current && !isCancelled) {
          setImageUrl(null);
          setIsLoading(false);
          setImageLoaded(false);
        }
      } finally {
        clearAvatarTimeout(timeoutRef);
      }
    }

    loadAvatar();

    return () => {
      isCancelled = true;
      cleanupAvatarLoad();
    };
  }, [userId, avatarUrl, image, forceRefresh, size, warningLabel]);

  function cleanupAvatarLoad() {
    isMountedRef.current = false;
    clearAvatarTimeout(timeoutRef);
  }

  return {
    imageUrl,
    isLoading,
    imageLoaded,
    handleImageLoad: () => {
      setImageLoaded(true);
      setIsLoading(false);
    },
    handleImageError: () => {
      console.warn(`[${warningLabel}] Image failed to load:`, imageUrl);
      setImageUrl(null);
      setIsLoading(false);
      setImageLoaded(false);
    },
  };
}
