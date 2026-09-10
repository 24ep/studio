import { DEFAULT_APP_NAME } from '../../lib/constants';
import { normalizeAppName } from '../../lib/branding';

export const HEADER_BRANDING_ZOOM_STORAGE_KEY = 'app-zoom-level';
export const HEADER_BRANDING_BASE_FONT_SIZE = 16;
export const HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM = 0.9;
export const HEADER_BRANDING_DEFAULT_MOBILE_ZOOM = 1;

export type HeaderBrandingSettings = Record<string, unknown>;

export interface HeaderBrandingState {
  appName: string;
  appLogoUrl: string | null;
}

export function parseHeaderBrandingSettingsResponse(data: unknown): HeaderBrandingSettings {
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

  return data as HeaderBrandingSettings;
}

export function buildHeaderBrandingState(
  settings: HeaderBrandingSettings,
  fallbackAppName = DEFAULT_APP_NAME
): HeaderBrandingState {
  return {
    appName: normalizeAppName(settings.appName, fallbackAppName),
    appLogoUrl: typeof settings.appLogoDataUrl === 'string' && settings.appLogoDataUrl ? settings.appLogoDataUrl : null,
  };
}

export function getInitialHeaderAppName(propAppName?: string) {
  return normalizeAppName(propAppName, DEFAULT_APP_NAME);
}

export function getInitialHeaderLogoUrl(propLogoUrl?: string | null) {
  return propLogoUrl || null;
}

export function deriveHeaderPageTitle(initialPageTitle: string, currentAppName: string) {
  return initialPageTitle === DEFAULT_APP_NAME && currentAppName !== DEFAULT_APP_NAME
    ? currentAppName
    : initialPageTitle;
}

export function getHeaderZoomLevel(isMobile: boolean, savedZoom: string | null) {
  if (isMobile) {
    return HEADER_BRANDING_DEFAULT_MOBILE_ZOOM;
  }

  if (savedZoom) {
    const parsedZoom = parseFloat(savedZoom);
    if (Number.isFinite(parsedZoom)) {
      return parsedZoom;
    }
  }

  return HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM;
}

export function shouldPersistDefaultHeaderZoom(isMobile: boolean, savedZoom: string | null) {
  return !isMobile && !savedZoom;
}

export function buildHeaderZoomStyleValues(zoomLevel: number) {
  const scaledFontSize = HEADER_BRANDING_BASE_FONT_SIZE * zoomLevel;

  return {
    rootFontSize: `${scaledFontSize}px`,
    bodyFontSize: `${scaledFontSize}px`,
    zoomScale: zoomLevel.toString(),
  };
}
