import type { SystemSetting } from "@/lib/types";

export const ALLOWED_SYSTEM_SETTING_KEYS = [
  'appName', 'appLogoDataUrl', 'appFaviconDataUrl', 'appThemePreference',
  'defaultMatchCriteria',
  'loginPageLogoLightMode', 'loginPageLogoDarkMode',
  'sidebarLogoCollapsedLightMode', 'sidebarLogoExpandedLightMode',
  'sidebarLogoCollapsedDarkMode', 'sidebarLogoExpandedDarkMode',
  'primaryGradientStart', 'primaryGradientEnd',
  'generalPdfWebhookUrl', 'geminiApiKey',
  'loginPageBackgroundType', 'loginPageBackgroundImageUrl',
  'loginPageBackgroundColor1', 'loginPageBackgroundColor2',
  'loginPageLayoutType',
  'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
  'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
  'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
  'buttonTextColorL', 'buttonTextColorD',
  'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
  'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
  'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
  'appFontFamily',
  'loginPageContent',
  'loginPageFooter',
  'maxConcurrentProcessors',
  'aiPowerSearchSystemPrompt',
  'applicantEvaluationCriteriaPrompt',
  'jobMatchFeatureEnabled',
  'pwaEnabled',
  'pwaName',
  'pwaShortName',
  'pwaDescription',
  'pwaThemeColor',
  'pwaBackgroundColor',
  'pwaAppleMobileWebAppTitle',
  'pwaAppleMobileWebAppStatusBarStyle',
];

export function filterAllowedSystemSettings(settings: SystemSetting[]): SystemSetting[] {
  return settings.filter((setting) => ALLOWED_SYSTEM_SETTING_KEYS.includes(setting.key));
}

export function renderSystemSettingValue(value: string | null): string {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function getSystemSettingCategory(key: string): string {
  if (key.startsWith('app')) return 'Application';
  if (key.startsWith('login')) return 'Login Page';
  if (key.startsWith('sidebar')) return 'Sidebar';
  if (key.includes('Webhook') || key.includes('Url')) return 'Webhooks';
  return 'General';
}

export function groupSystemSettingsByCategory(settings: SystemSetting[]) {
  return settings.reduce<Record<string, SystemSetting[]>>((acc, setting) => {
    const category = getSystemSettingCategory(setting.key);
    acc[category] = [...(acc[category] ?? []), setting];
    return acc;
  }, {});
}
