import type { UseSystemPreferenceLoaderArgs } from "./use-system-preference-loader";
import type { SystemPreferencePageState } from "./system-preference-page-state-type";

export function buildSystemPreferenceLoaderInput({
  cleanupObjectUrls,
  currentPath,
  sessionStatus,
  state,
}: {
  cleanupObjectUrls: () => void;
  currentPath: string;
  sessionStatus: UseSystemPreferenceLoaderArgs["sessionStatus"];
  state: SystemPreferencePageState;
}): UseSystemPreferenceLoaderArgs {
  return {
    sessionStatus,
    currentPath,
    isMountedRef: state.isMountedRef,
    abortControllerRef: state.abortControllerRef,
    cleanupObjectUrls,
    setIsClient: state.setIsClient,
    setLoading: state.setLoading,
    setErrorMsg: state.setErrorMsg,
    loadedPreferenceStateSetters: state.loadedPreferenceStateSetters,
  };
}
