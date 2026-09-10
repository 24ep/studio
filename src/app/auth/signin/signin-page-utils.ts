import type { SystemSetting } from '@/lib/types';

export const DEFAULT_PRIMARY_GRADIENT_START_SIGNIN = '220 78% 28%';
export const DEFAULT_PRIMARY_GRADIENT_END_SIGNIN = '222 72% 36%';

export type SignInSettingsMap = Record<string, unknown>;

export function normalizeSignInSettingsPayload(data: unknown): SignInSettingsMap {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const settings = (data as { settings?: unknown }).settings;
  if (Array.isArray(settings)) {
    return Object.fromEntries(
      settings
        .filter((setting): setting is { key: string; value: unknown } => (
          !!setting &&
          typeof setting === 'object' &&
          typeof (setting as { key?: unknown }).key === 'string'
        ))
        .map(setting => [setting.key, setting.value])
    );
  }

  return data as SignInSettingsMap;
}

export function getInitialSignInSetting(
  settings: SystemSetting[] | undefined,
  key: string,
  fallback = ''
) {
  return settings?.find(setting => setting.key === key)?.value ?? fallback;
}

export function buildSignInActiveColors({
  initialSettings,
  isThemeDark,
}: {
  initialSettings?: SystemSetting[];
  isThemeDark: boolean;
}) {
  if (!initialSettings) {
    return {
      activeFontColor: '#fff',
      activeBgStart: DEFAULT_PRIMARY_GRADIENT_START_SIGNIN,
      activeBgEnd: DEFAULT_PRIMARY_GRADIENT_END_SIGNIN,
    };
  }

  const primaryStart = getInitialSignInSetting(
    initialSettings,
    'primaryGradientStart',
    DEFAULT_PRIMARY_GRADIENT_START_SIGNIN
  );
  const primaryEnd = getInitialSignInSetting(
    initialSettings,
    'primaryGradientEnd',
    DEFAULT_PRIMARY_GRADIENT_END_SIGNIN
  );

  return {
    activeFontColor: getInitialSignInSetting(
      initialSettings,
      isThemeDark ? 'sidebarActiveTextD' : 'sidebarActiveTextL',
      '#fff'
    ),
    activeBgStart: primaryStart,
    activeBgEnd: primaryEnd,
  };
}

export function getSafeSignInRedirectUrl(rawRedirectUrl: string | null) {
  const redirectUrl = rawRedirectUrl?.startsWith('/') && !rawRedirectUrl.startsWith('//')
    ? rawRedirectUrl
    : '/';

  if (redirectUrl === '/auth/signin' || redirectUrl.startsWith('/auth/signin?')) {
    return '/';
  }

  return redirectUrl;
}

export function buildSignInAuthConfigState(data: unknown) {
  const settings = normalizeSignInSettingsPayload(data);
  const source = data && typeof data === 'object' && 'settings' in data
    ? data as Record<string, unknown>
    : settings;
  const rawAzureAdConfigured = source.isAzureAdConfigured;

  return {
    settings,
    isAzureAdConfigured: rawAzureAdConfigured === true || rawAzureAdConfigured === 'true',
    basicAuthEnabled: settings.basicAuthEnabled !== 'false',
  };
}
