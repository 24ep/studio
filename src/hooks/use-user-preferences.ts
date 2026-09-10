import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';

import {
  loadUserPreferencesFromApi,
} from './user-preferences-api';
import {
  defaultPreferences,
  type AppearancePreferences,
  type AccessibilityPreferences,
  type PositionsPreferences,
  type PreferenceModelType,
  type SidebarPreferences,
  type TaskBoardPreferences,
  type UserPreferences,
} from './user-preferences-defaults';
import { isUserPreferencesReady } from './user-preferences-session-utils';
import { useUserPreferenceActions } from './use-user-preference-actions';
import { useUserPreferenceAutosave } from './use-user-preference-autosave';

export type {
  AppearancePreferences,
  AccessibilityPreferences,
  PositionsPreferences,
  PreferenceModelType,
  SidebarPreferences,
  TaskBoardPreferences,
  UserPreferences,
} from './user-preferences-defaults';

export function useUserPreferences() {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInitializedRef = useRef(false);
  const userId = session?.user?.id;
  const isReady = useMemo(() => isUserPreferencesReady(status, userId), [status, userId]);
  const { isSavingRef, savePreferences } = useUserPreferenceAutosave({ isReady, userId });
  const actions = useUserPreferenceActions({
    savePreferences,
    setPreferences,
    userId,
  });

  const loadPreferences = useCallback(async () => {
    if (!isReady || !userId || isSavingRef.current) {
      console.warn('useUserPreferences: Cannot load preferences - not ready or already saving');
      return;
    }

    try {
      setIsLoading(true);
      setPreferences(await loadUserPreferencesFromApi());
    } finally {
      setIsLoaded(true);
      setIsLoading(false);
    }
  }, [isReady, isSavingRef, userId]);

  useEffect(() => {
    if (isInitializedRef.current) return;

    if (isReady && status === 'authenticated' && userId) {
      isInitializedRef.current = true;
      loadPreferences();
    } else if (status === 'unauthenticated') {
      isInitializedRef.current = true;
      setPreferences(defaultPreferences);
      setIsLoaded(true);
    }
  }, [isReady, loadPreferences, status, userId]);

  return {
    preferences,
    taskBoard: preferences.taskBoard,
    positions: preferences.positions,
    appearance: preferences.appearance,
    sidebar: preferences.sidebar,
    accessibility: preferences.accessibility,
    ...actions,
    isLoaded,
    isLoading,
    isAuthenticated: status === 'authenticated',
  };
}
