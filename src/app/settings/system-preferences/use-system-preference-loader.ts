"use client";

import { useEffect, type MutableRefObject } from "react";
import { signIn } from "next-auth/react";

import { applySidebarStyles, cleanupSidebarBackground, setThemeAndColors } from "@/lib/themeUtils";
import {
  applyLoadedSystemPreferenceState,
  buildLoadedSystemPreferencesState,
  type LoadedSystemPreferenceStateSetters,
} from "@/components/settings/system-preferences/utils";
import { fetchSystemPreferences } from "./system-preferences-api";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface UseSystemPreferenceLoaderArgs {
  sessionStatus: SessionStatus;
  currentPath: string;
  isMountedRef: MutableRefObject<boolean>;
  abortControllerRef: MutableRefObject<AbortController | null>;
  cleanupObjectUrls: () => void;
  setIsClient: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setErrorMsg: (value: string | null) => void;
  loadedPreferenceStateSetters: Omit<LoadedSystemPreferenceStateSetters, "applySidebarStyles" | "setThemeAndColors">;
}

export function useSystemPreferenceLoader({
  sessionStatus,
  currentPath,
  isMountedRef,
  abortControllerRef,
  cleanupObjectUrls,
  setIsClient,
  setLoading,
  setErrorMsg,
  loadedPreferenceStateSetters,
}: UseSystemPreferenceLoaderArgs) {
  useEffect(() => {
    isMountedRef.current = true;
    setIsClient(true);

    if (sessionStatus === "unauthenticated") {
      signIn(undefined, { callbackUrl: currentPath });
      return undefined;
    }

    if (sessionStatus === "authenticated") {
      async function fetchPrefs() {
        if (!isMountedRef.current) return;

        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setErrorMsg(null);

        try {
          const data = await fetchSystemPreferences({
            signal: abortControllerRef.current.signal,
          });

          if (!isMountedRef.current) return;

          const loadedPreferences = buildLoadedSystemPreferencesState(data);
          applyLoadedSystemPreferenceState(loadedPreferences, {
            ...loadedPreferenceStateSetters,
            applySidebarStyles,
            setThemeAndColors,
          });
        } catch (e: unknown) {
          if (!isMountedRef.current) return;

          const error = e as Error;
          if (error.name !== "AbortError") {
            setErrorMsg(error.message || "Failed to load preferences");
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      }

      fetchPrefs();
    }

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      cleanupObjectUrls();
      cleanupSidebarBackground();
    };
  }, [
    abortControllerRef,
    cleanupObjectUrls,
    currentPath,
    isMountedRef,
    loadedPreferenceStateSetters,
    sessionStatus,
    setErrorMsg,
    setIsClient,
    setLoading,
  ]);
}
