export const ORGANIZATION_LOGO_DATA_URL_KEY = 'organizationLogoDataUrl';
export const ORGANIZATION_NAME_KEY = 'organizationName';
export const ORGANIZATION_ADDRESS_KEY = 'organizationAddress';
export const ORGANIZATION_CONTACT_KEY = 'organizationContact';
export const ORGANIZATION_PROFILE_KEY = 'organizationProfile';

export const DEFAULT_ICS_DESCRIPTION =
  'Interview with {{ApplicantName}} for position {{positionTitle}}.\n\nLocation: {{interviewLocation}}\nInterviewer: {{interviewerName}}';
export const DEFAULT_PWA_NAME = 'hrive - AI-assisted recruitment platform';
export const DEFAULT_PWA_SHORT_NAME = 'hrive';
export const DEFAULT_PWA_DESCRIPTION = 'AI-assisted recruitment and applicant management platform';
export const DEFAULT_PWA_THEME_COLOR = '#000000';
export const DEFAULT_PWA_BACKGROUND_COLOR = '#171a26';
export const DEFAULT_PWA_STATUS_BAR_STYLE = 'default';

export const SYSTEM_SETTINGS_TAB_IDS = [
  'organize',
  'domain-verification',
  'broadcast-banner',
  'features',
  'email-server',
  'email-templates',
  'login-methods',
  'security',
  'system-api-keys',
  'processing',
  'match-criteria',
  'pwa',
  'auto-close',
  'ai-search',
  'ai-api-keys',
  'ai-prompts',
  'digital-footprint',
  'knowledge-base',
  'monitoring',
  'azure',
] as const;

export type SystemSettingsTabId = (typeof SYSTEM_SETTINGS_TAB_IDS)[number];

export function isSystemSettingsTabId(value: string | null): value is SystemSettingsTabId {
  return Boolean(value && SYSTEM_SETTINGS_TAB_IDS.includes(value as SystemSettingsTabId));
}
