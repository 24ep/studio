import {
  applyAppLayoutThemeSettings,
  buildAppConfigChangedUpdates,
  buildAppLayoutConfigUpdates,
  buildAppLayoutThemeConfig,
  parseAppLayoutSettingsResponse,
} from './app-layout-settings';

type TimeoutRef = { current: NodeJS.Timeout | null };
type MountedRef = { current: boolean };

export interface AppLayoutGlobalSettingsRefs {
  resetToDefaultsRef: { current: (() => void) | null };
  setLogoLoadingRef: { current: ((isLoading: boolean) => void) | null };
  updateAppConfigRef: { current: ((updates: Record<string, unknown>) => void) | null };
  updateThemeAndColorsRef: { current: ((updates: ReturnType<typeof buildAppLayoutThemeConfig>) => void) | null };
}

export interface AppConfigChangedDetail {
  appName?: string;
  logoUrl?: string | null;
  showLogoOnly?: boolean;
  sidebarLogoSize?: number;
  collapsedSidebarLogoSize?: number;
  sidebarNavigationMode?: unknown;
  sidebarSecondaryGroupLabels?: unknown;
}

export function clearAppLayoutTimeout(timeoutRef: TimeoutRef) {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

export async function fetchAndApplyAppLayoutGlobalSettings({
  fetchSettings,
  fetchTimeoutRef,
  isMountedRef,
  refs,
  timeoutMs = 15000,
}: {
  fetchSettings: () => Promise<unknown>;
  fetchTimeoutRef: TimeoutRef;
  isMountedRef: MountedRef;
  refs: AppLayoutGlobalSettingsRefs;
  timeoutMs?: number;
}) {
  if (!isMountedRef.current) return;

  try {
    refs.setLogoLoadingRef.current?.(true);
    const data = await fetchSettingsWithTimeout(fetchSettings, fetchTimeoutRef, timeoutMs);

    if (!isMountedRef.current) return;
    if (!data) throw new Error('Failed to fetch settings');

    const prefs = parseAppLayoutSettingsResponse(data);
    const themeConfig = buildAppLayoutThemeConfig(prefs);

    refs.updateAppConfigRef.current?.(buildAppLayoutConfigUpdates(prefs));
    refs.updateThemeAndColorsRef.current?.(themeConfig);
    applyAppLayoutThemeSettings(prefs, themeConfig);
  } catch (error) {
    console.warn('[APPLAYOUT] Failed to fetch global settings:', error);
    refs.resetToDefaultsRef.current?.();
  } finally {
    if (isMountedRef.current) {
      refs.setLogoLoadingRef.current?.(false);
    }
    clearAppLayoutTimeout(fetchTimeoutRef);
  }
}

export function handleAppConfigChangedEvent({
  event,
  isMounted,
  updateAppConfig,
}: {
  event: Event;
  isMounted: boolean;
  updateAppConfig?: ((updates: Record<string, unknown>) => void) | null;
}) {
  if (!isMounted) return;

  try {
    const customEvent = event as CustomEvent<AppConfigChangedDetail>;
    const updates = buildAppConfigChangedUpdates(customEvent.detail);

    if (Object.keys(updates).length > 0) {
      updateAppConfig?.(updates);
    }
  } catch (error) {
    console.warn('[APPLAYOUT] Error handling app config change:', error);
  }
}

async function fetchSettingsWithTimeout<T>(
  fetchSettings: () => Promise<T>,
  fetchTimeoutRef: TimeoutRef,
  timeoutMs: number
) {
  return Promise.race([
    fetchSettings(),
    new Promise<never>((_, reject) => {
      fetchTimeoutRef.current = setTimeout(() => {
        reject(new Error('Settings fetch timeout'));
      }, timeoutMs);
    }),
  ]);
}
