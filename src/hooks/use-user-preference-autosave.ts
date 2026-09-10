import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';

import { saveUserPreferenceModel } from './user-preferences-api';
import type { PreferenceModelType } from './user-preferences-defaults';

const PREFERENCE_SAVE_DEBOUNCE_MS = 500;
const CLEAR_SAVING_FLAG_DELAY_MS = 100;

interface UseUserPreferenceAutosaveOptions {
  isReady: boolean;
  userId: string | undefined;
}

function clearTimeoutRef(timeoutRef: MutableRefObject<NodeJS.Timeout | null>) {
  if (!timeoutRef.current) return;

  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

export function useUserPreferenceAutosave({
  isReady,
  userId,
}: UseUserPreferenceAutosaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearSavingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const clearSavingFlagSoon = useCallback(() => {
    clearTimeoutRef(clearSavingTimeoutRef);
    clearSavingTimeoutRef.current = setTimeout(() => {
      isSavingRef.current = false;
    }, CLEAR_SAVING_FLAG_DELAY_MS);
  }, []);

  const savePreferences = useCallback((modelType: PreferenceModelType, updates: unknown) => {
    if (!isReady || !userId) {
      console.warn('useUserPreferences: Cannot save preferences - not ready or no session');
      return;
    }

    clearTimeoutRef(saveTimeoutRef);
    saveTimeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      await saveUserPreferenceModel(modelType, updates);
      clearSavingFlagSoon();
    }, PREFERENCE_SAVE_DEBOUNCE_MS);
  }, [clearSavingFlagSoon, isReady, userId]);

  useEffect(() => {
    return () => {
      clearTimeoutRef(saveTimeoutRef);
      clearTimeoutRef(clearSavingTimeoutRef);
    };
  }, []);

  return {
    isSavingRef,
    savePreferences,
  };
}
