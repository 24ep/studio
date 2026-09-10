import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to manage avatar refresh state across the application
 * This allows components to force refresh avatars when profile images are updated
 */
export function useAvatarRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: session, update } = useSession();

  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const forceRefreshForUser = useCallback((userId: string) => {
    // Force refresh for a specific user
    setRefreshKey(prev => prev + 1);
  }, []);

  const refreshSessionAvatar = useCallback(async (newAvatarUrl: string) => {
    if (session?.user) {
      try {
        await update({
          ...session,
          user: {
            ...session.user,
            avatarUrl: newAvatarUrl,
          },
        });
        forceRefresh();
      } catch (error) {
        // Silent error handling for avatar refresh
      }
    }
  }, [session?.user?.id, update, forceRefresh]);

  return {
    refreshKey,
    forceRefresh,
    forceRefreshForUser,
    refreshSessionAvatar,
  };
}

/**
 * Hook to get the current avatar refresh state
 * Components can use this to determine if they should force refresh
 */
export function useAvatarRefreshState() {
  const [refreshKey, setRefreshKey] = useState(0);

  const updateRefreshKey = useCallback((newKey: number) => {
    setRefreshKey(newKey);
  }, []);

  return {
    refreshKey,
    updateRefreshKey,
  };
}

/**
 * Hook to automatically refresh avatars when session changes
 */
export function useAvatarSessionSync() {
  const { data: session } = useSession();
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  
  const forceRefresh = useCallback(() => {
    setLocalRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Force refresh when session avatar URL changes
    if (session?.user?.avatarUrl) {
      setLocalRefreshKey(prev => prev + 1);
    }
  }, [session?.user?.avatarUrl]);

  return { forceRefresh, refreshKey: localRefreshKey };
}
