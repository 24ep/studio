import type { useSystemPreferenceImageActions } from "./use-system-preference-image-actions";
import type { useSystemPreferencePageState } from "./use-system-preference-page-state";

export type SystemPreferencePageState = ReturnType<typeof useSystemPreferencePageState>;
export type SystemPreferenceImageActions = ReturnType<typeof useSystemPreferenceImageActions>;

export interface SystemPreferencesLoadedViewBuilderOptions {
  canEdit: boolean;
  imageActions: SystemPreferenceImageActions;
  onSave: () => void;
  state: SystemPreferencePageState;
}
