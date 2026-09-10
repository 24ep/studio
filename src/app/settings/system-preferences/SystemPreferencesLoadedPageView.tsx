"use client";

import { SystemPreferencesPageView } from "./SystemPreferencesPageView";
import { buildSystemPreferencesPageViewProps } from "./system-preferences-loaded-view-props";
import type { useSystemPreferenceImageActions } from "./use-system-preference-image-actions";
import type { useSystemPreferencePageState } from "./use-system-preference-page-state";

type SystemPreferencePageState = ReturnType<typeof useSystemPreferencePageState>;
type SystemPreferenceImageActions = ReturnType<typeof useSystemPreferenceImageActions>;

interface SystemPreferencesLoadedPageViewProps {
  state: SystemPreferencePageState;
  imageActions: SystemPreferenceImageActions;
  canEdit: boolean;
  isEmbedded: boolean;
  onSave: () => void;
}

export function SystemPreferencesLoadedPageView({
  state,
  imageActions,
  canEdit,
  isEmbedded,
  onSave,
}: SystemPreferencesLoadedPageViewProps) {
  return (
    <SystemPreferencesPageView
      isEmbedded={isEmbedded}
      {...buildSystemPreferencesPageViewProps({
        canEdit,
        imageActions,
        onSave,
        state,
      })}
    />
  );
}
