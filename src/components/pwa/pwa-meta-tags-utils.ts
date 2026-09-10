import { normalizeSystemSettingsResponse } from './pwa-settings-utils';

export const DARK_THEME_BACKGROUND = '#171a26';
export const LIGHT_THEME_BACKGROUND = '#ffffff';
export const DEFAULT_PWA_THEME_COLOR = '#000000';
export const DEFAULT_PWA_APPLE_TITLE = 'hrive';
export const DEFAULT_PWA_APPLE_STATUS_BAR_STYLE = 'default';
export const PWA_MANIFEST_HREF = '/api/manifest.json';
export const PWA_APPLE_TOUCH_ICON_HREF = '/icon-192x192.png';

export type ThemePreference = 'dark' | 'light' | 'system' | string | null;

export interface PwaMetaSettings {
  themeColor: string;
  backgroundColor: string;
  appleTitle: string;
  appleStatusBarStyle: string;
}

export function getPwaMetaSettings(data: unknown): PwaMetaSettings {
  const settings = normalizeSystemSettingsResponse(data);

  return {
    themeColor: String(settings.pwaThemeColor || DEFAULT_PWA_THEME_COLOR),
    backgroundColor: String(settings.pwaBackgroundColor || DARK_THEME_BACKGROUND),
    appleTitle: String(settings.pwaAppleMobileWebAppTitle || settings.appName || DEFAULT_PWA_APPLE_TITLE),
    appleStatusBarStyle: String(settings.pwaAppleMobileWebAppStatusBarStyle || DEFAULT_PWA_APPLE_STATUS_BAR_STYLE),
  };
}

export function getBackgroundColorFromThemeState({
  isDarkClassApplied,
  savedTheme,
  prefersDark,
}: {
  isDarkClassApplied: boolean;
  savedTheme: ThemePreference;
  prefersDark: boolean;
}) {
  if (isDarkClassApplied || savedTheme === 'dark' || (!savedTheme || savedTheme === 'system') && prefersDark) {
    return DARK_THEME_BACKGROUND;
  }

  return LIGHT_THEME_BACKGROUND;
}

export function shouldUseDynamicThemeColor(themeColor?: string) {
  return !themeColor || themeColor === DEFAULT_PWA_THEME_COLOR;
}

export function getAppleMetaTags(settings: PwaMetaSettings) {
  return [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: settings.appleStatusBarStyle },
    { name: 'apple-mobile-web-app-title', content: settings.appleTitle },
  ];
}

export const PWA_META_TAG_NAMES = [
  'theme-color',
  'apple-mobile-web-app-capable',
  'mobile-web-app-capable',
  'apple-mobile-web-app-status-bar-style',
  'apple-mobile-web-app-title',
];

export function readBrowserBackgroundColor() {
  if (typeof window === 'undefined') return DARK_THEME_BACKGROUND;

  let savedTheme: ThemePreference = null;
  try {
    savedTheme = localStorage.getItem('theme');
  } catch {
    savedTheme = null;
  }

  return getBackgroundColorFromThemeState({
    isDarkClassApplied: document.documentElement.classList.contains('dark'),
    savedTheme,
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  });
}

function ensureMetaTag(doc: Document, name: string) {
  let meta = doc.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = doc.createElement('meta');
    meta.setAttribute('name', name);
    doc.head.appendChild(meta);
  }

  return meta;
}

function ensureLink(doc: Document, rel: string, href: string) {
  let link = doc.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = doc.createElement('link');
    link.rel = rel;
    doc.head.appendChild(link);
  }

  link.href = href;
}

export function applyPwaMetaTags(
  doc: Document,
  settings: PwaMetaSettings,
  getBackgroundColor = readBrowserBackgroundColor
) {
  ensureLink(doc, 'manifest', PWA_MANIFEST_HREF);

  const themeColorMeta = ensureMetaTag(doc, 'theme-color');
  themeColorMeta.setAttribute(
    'content',
    shouldUseDynamicThemeColor(settings.themeColor) ? getBackgroundColor() : settings.themeColor
  );

  for (const { name, content } of getAppleMetaTags(settings)) {
    ensureMetaTag(doc, name).setAttribute('content', content);
  }

  ensureLink(doc, 'apple-touch-icon', PWA_APPLE_TOUCH_ICON_HREF);
}

export function removePwaMetaTags(doc: Document) {
  doc.querySelector('link[rel="manifest"]')?.remove();
  doc.querySelector('link[rel="apple-touch-icon"]')?.remove();

  for (const name of PWA_META_TAG_NAMES) {
    doc.querySelector(`meta[name="${name}"]`)?.remove();
  }
}

export function updateDynamicThemeColor(doc: Document, themeColor?: string) {
  if (!shouldUseDynamicThemeColor(themeColor)) return;

  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', readBrowserBackgroundColor());
}
