
"use client";

import { useCallback, useEffect, useRef, type SyntheticEvent } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { SystemPreferencesTabId } from "@/components/settings/system-preferences/SystemPreferencesNavigation";
import {
  canEditSystemPreferences,
} from "@/components/settings/system-preferences/utils";
import { SystemPreferencesLoadedPageView } from "./SystemPreferencesLoadedPageView";
import {
  buildSystemPreferenceImageActionsInput,
  buildSystemPreferenceLoaderInput,
  buildSystemPreferenceSaveActionInput,
  buildSystemPreferenceStyleEffectsInput,
} from "./system-preference-page-inputs";
import { useSystemPreferenceImageActions } from "./use-system-preference-image-actions";
import { useSystemPreferenceLoader } from "./use-system-preference-loader";
import { useSystemPreferencePageState } from "./use-system-preference-page-state";
import { useSystemPreferenceSaveAction } from "./use-system-preference-save-action";
import { useSystemPreferenceStyleEffects } from "./use-system-preference-style-effects";

const SYSTEM_PREFERENCE_TAB_IDS: SystemPreferencesTabId[] = [
  "general",
  "appearance",
  "branding",
  "sidebar",
  "evaluate",
];

export default function SystemPreferencesPage() {
  const { error: showError } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const currentPath =
    typeof window !== "undefined"
      ? window.location.pathname
      : "/settings/system-preferences";
  const preferenceState = useSystemPreferencePageState();
  const canEdit = canEditSystemPreferences(session?.user);
  const requestedTab = searchParams.get("tab");
  const isEmbedded = searchParams.get("adminCenterEmbed") === "1";

  useEffect(() => {
    if (
      requestedTab
      && SYSTEM_PREFERENCE_TAB_IDS.includes(requestedTab as SystemPreferencesTabId)
      && preferenceState.activeTab !== requestedTab
    ) {
      preferenceState.setActiveTab(requestedTab as SystemPreferencesTabId);
    }
  }, [preferenceState.activeTab, preferenceState.setActiveTab, requestedTab]);

  const imageActions = useSystemPreferenceImageActions(
    buildSystemPreferenceImageActionsInput({
      showError,
      state: preferenceState,
    }),
  );
  const { cleanupObjectUrls } = imageActions;

  useSystemPreferenceLoader(
    buildSystemPreferenceLoaderInput({
      sessionStatus,
      currentPath,
      cleanupObjectUrls,
      state: preferenceState,
    }),
  );

  useSystemPreferenceStyleEffects(
    buildSystemPreferenceStyleEffectsInput(preferenceState),
  );

  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSavePreferences = useSystemPreferenceSaveAction(
    buildSystemPreferenceSaveActionInput({
      success: () => {
        preferenceState.setSaveConfirmed(true);
        if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
        savedStatusTimerRef.current = setTimeout(() => {
          preferenceState.setSaveConfirmed(false);
        }, 2500);
      },
      showError,
      state: preferenceState,
    }),
  );
  const latestSaveActionRef = useRef(handleSavePreferences);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  latestSaveActionRef.current = handleSavePreferences;

  const scheduleAutoSave = useCallback((event: SyntheticEvent<HTMLElement>) => {
    if (!canEdit) return;
    if ((event.target as HTMLElement).closest("[data-autosave-ignore]")) return;
    preferenceState.setSaveConfirmed(false);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(() => latestSaveActionRef.current());
    }, 700);
  }, [canEdit, preferenceState.setSaveConfirmed]);

  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (savedStatusTimerRef.current) {
      clearTimeout(savedStatusTimerRef.current);
    }
  }, []);

  if (
    !preferenceState.isClient ||
    preferenceState.loading ||
    sessionStatus === "loading"
  ) {
    return (
      <div className="flex w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (preferenceState.errorMsg) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">
            {preferenceState.errorMsg}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const canEditPreferences = canEdit ?? false;

  return (
    <div
      className="h-full"
      onChangeCapture={scheduleAutoSave}
      onClickCapture={scheduleAutoSave}
    >
      <SystemPreferencesLoadedPageView
        state={preferenceState}
        imageActions={imageActions}
        canEdit={canEditPreferences}
        isEmbedded={isEmbedded}
        onSave={handleSavePreferences}
      />
    </div>
  );
}
