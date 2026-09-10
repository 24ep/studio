import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';

import {
  canSyncUserPresence,
  fetchOnlineUserPresence,
  removeCurrentUserPresence,
  updateCurrentUserPresence,
  type UserPresence,
} from './user-presence-api';

export type { UserPresence } from './user-presence-api';

export function useUserPresence() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const sessionUser = session?.user;
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isUpdatingRef = useRef(false);

  const updatePresence = useCallback(async () => {
    if (!canSyncUserPresence(sessionUser) || isUpdatingRef.current) {
      return;
    }

    isUpdatingRef.current = true;
    try {
      await updateCurrentUserPresence(sessionUser, pathname);
    } catch (error) {
    } finally {
      isUpdatingRef.current = false;
    }
  }, [sessionUser, pathname]);

  const fetchPresence = useCallback(async () => {
    if (!sessionUser?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      setOnlineUsers(await fetchOnlineUserPresence(sessionUser.id));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionUser?.id]);

  const removePresence = useCallback(async () => {
    try {
      await removeCurrentUserPresence(sessionUser?.id);
    } catch (error) {
    }
  }, [sessionUser?.id]);

  useEffect(() => {
    if (sessionUser?.id) {
      updatePresence();
    }
  }, [pathname, sessionUser?.id, updatePresence]);

  useVisibilityInterval(updatePresence, 30000, !!sessionUser?.id);
  useVisibilityInterval(fetchPresence, 60000, !!sessionUser?.id);

  useEffect(() => {
    if (!sessionUser?.id) return;
    updatePresence();
    fetchPresence();

    return () => {
      removePresence();
    };
  }, [sessionUser?.id, updatePresence, fetchPresence, removePresence]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeUnload = () => {
      removePresence();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [removePresence]);

  return useMemo(() => ({
    onlineUsers,
    isLoading,
    error,
    updatePresence,
    fetchPresence,
    removePresence,
  }), [onlineUsers, isLoading, error, updatePresence, fetchPresence, removePresence]);
}
