import { readJsonOrFallback } from '../../lib/response-json';
import { normalizeSystemSettingsResponse } from '../../lib/system-settings-response';
import { APP_LAYOUT_SIDEBAR_COLOR_KEYS } from './app-layout-sidebar-color-keys';

const APP_LAYOUT_SETTINGS_KEYS = [
  'appName', 'showLogoOnly', 'sidebarLogoSize', 'collapsedSidebarLogoSize',
  'sidebarLogoCollapsedLightMode', 'sidebarLogoExpandedLightMode', 'sidebarLogoCollapsedDarkMode',
  'sidebarLogoExpandedDarkMode', 'appThemePreference', 'primaryGradient', 'primaryButtonShadowL',
  'primaryButtonShadowHoverL', 'primaryButtonShadowD', 'primaryButtonShadowHoverD', 'sidebarBackgroundType',
  'sidebarBackgroundImageUrl', 'sidebarBackgroundImageFit', 'sidebarBackgroundImagePosition',
  'sidebarNavigationMode', 'sidebarSecondaryGroupLabels', ...APP_LAYOUT_SIDEBAR_COLOR_KEYS,
];

const APP_LAYOUT_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSettings: { value: unknown; expiresAt: number } | null = null;
let settingsRequest: Promise<unknown> | null = null;

interface AccountLauncherApplication {
  applicationId?: unknown;
  name?: unknown;
  iconUrl?: unknown;
  launchUrl?: unknown;
}
interface AccountLauncherPayload { applications?: unknown; }

function normalizeHost(url: string) {
  try { return new URL(url).host.toLowerCase(); } catch { return ''; }
}

function selectCurrentAccountApplication(payload: AccountLauncherPayload) {
  if (!Array.isArray(payload.applications)) return null;
  const applications = payload.applications.filter(
    (value): value is AccountLauncherApplication => Boolean(value) && typeof value === 'object'
  );
  const currentHost = typeof window !== 'undefined' ? window.location.host.toLowerCase() : '';
  const hostMatch = currentHost ? applications.find(application => (
    typeof application.launchUrl === 'string' && normalizeHost(application.launchUrl) === currentHost
  )) : null;
  if (hostMatch) return hostMatch;

  return applications.find(application => {
    if (typeof application.name !== 'string') return false;
    const name = application.name.trim().toLowerCase();
    return name === 'hrive' || name === 'obsi people' || name === 'obsi people / hrive'
      || name.includes('hrive') || name.includes('obsi people');
  }) ?? null;
}

async function fetchOutbornApplicationBranding() {
  try {
    const response = await fetch('/api/outborn/application-launcher', {
      cache: 'no-store', credentials: 'same-origin',
    });
    if (!response.ok) return null;
    const payload = await readJsonOrFallback<AccountLauncherPayload>(response, {});
    const application = selectCurrentAccountApplication(payload);
    if (!application) return null;
    const appName = typeof application.name === 'string' && application.name.trim() ? application.name.trim() : null;
    const appLogoDataUrl = typeof application.iconUrl === 'string' && application.iconUrl.trim() ? application.iconUrl.trim() : null;
    if (!appName && !appLogoDataUrl) return null;
    return { appName, appLogoDataUrl };
  } catch (error) {
    console.warn('[APPLAYOUT] Unable to load Outborn Account application branding:', error);
    return null;
  }
}

export async function fetchLayoutSystemSettings(forceRefresh = false): Promise<unknown> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && cachedSettings.expiresAt > now) return cachedSettings.value;
  if (!forceRefresh && settingsRequest) return settingsRequest;

  const params = new URLSearchParams({ keys: APP_LAYOUT_SETTINGS_KEYS.join(',') });
  const request = (async () => {
    const [settingsResponse, accountBranding] = await Promise.all([
      fetch(`/api/settings/system-settings?${params.toString()}`, { cache: 'no-store' }),
      fetchOutbornApplicationBranding(),
    ]);
    const settingsValue = settingsResponse.ok ? await readJsonOrFallback<unknown>(settingsResponse, {}) : {};
    const localSettings = normalizeSystemSettingsResponse(settingsValue);

    // Outborn Account is the only authority for the application icon. Never
    // fall back to a locally stored appLogoDataUrl, otherwise branding can
    // drift between the Account application registry and Hrive.
    const value = {
      ...localSettings,
      appLogoDataUrl: accountBranding?.appLogoDataUrl ?? null,
      ...(accountBranding?.appName ? { appName: accountBranding.appName } : {}),
    };

    cachedSettings = { value, expiresAt: Date.now() + APP_LAYOUT_SETTINGS_CACHE_TTL_MS };
    return value;
  })();
  settingsRequest = request;

  try { return await request; }
  finally { if (settingsRequest === request) settingsRequest = null; }
}
