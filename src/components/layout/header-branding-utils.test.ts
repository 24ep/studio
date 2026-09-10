import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_NAME } from '../../lib/constants';
import {
  HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM,
  HEADER_BRANDING_DEFAULT_MOBILE_ZOOM,
  buildHeaderBrandingState,
  buildHeaderZoomStyleValues,
  deriveHeaderPageTitle,
  getHeaderZoomLevel,
  getInitialHeaderAppName,
  getInitialHeaderLogoUrl,
  parseHeaderBrandingSettingsResponse,
  shouldPersistDefaultHeaderZoom,
} from './header-branding-utils';

describe('header-branding-utils', () => {
  it('normalizes settings payloads from array and object API shapes', () => {
    expect(parseHeaderBrandingSettingsResponse({
      settings: [
        { key: 'appName', value: 'Talent Desk' },
        { key: 'appLogoDataUrl', value: '/logo.png' },
        { value: 'ignored' },
      ],
    })).toEqual({
      appName: 'Talent Desk',
      appLogoDataUrl: '/logo.png',
    });

    expect(parseHeaderBrandingSettingsResponse({ appName: 'Object Shape' })).toEqual({
      appName: 'Object Shape',
    });
    expect(parseHeaderBrandingSettingsResponse(null)).toEqual({});
  });

  it('builds branding state with app name and logo fallbacks', () => {
    expect(buildHeaderBrandingState({ appName: 'Talent Desk', appLogoDataUrl: '/logo.png' })).toEqual({
      appName: 'Talent Desk',
      appLogoUrl: '/logo.png',
    });
    expect(buildHeaderBrandingState({ appName: '', appLogoDataUrl: '' })).toEqual({
      appName: DEFAULT_APP_NAME,
      appLogoUrl: null,
    });
  });

  it('derives initial app name and logo values from props', () => {
    expect(getInitialHeaderAppName('Custom')).toBe('Custom');
    expect(getInitialHeaderAppName()).toBe(DEFAULT_APP_NAME);
    expect(getInitialHeaderLogoUrl('/logo.png')).toBe('/logo.png');
    expect(getInitialHeaderLogoUrl(null)).toBeNull();
  });

  it('derives the page title from default title and current app name', () => {
    expect(deriveHeaderPageTitle(DEFAULT_APP_NAME, 'Talent Desk')).toBe('Talent Desk');
    expect(deriveHeaderPageTitle('Applicants', 'Talent Desk')).toBe('Applicants');
    expect(deriveHeaderPageTitle(DEFAULT_APP_NAME, DEFAULT_APP_NAME)).toBe(DEFAULT_APP_NAME);
  });

  it('chooses mobile, saved, and default desktop zoom levels', () => {
    expect(getHeaderZoomLevel(true, '0.75')).toBe(HEADER_BRANDING_DEFAULT_MOBILE_ZOOM);
    expect(getHeaderZoomLevel(false, '0.75')).toBe(0.75);
    expect(getHeaderZoomLevel(false, 'invalid')).toBe(HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM);
    expect(getHeaderZoomLevel(false, null)).toBe(HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM);
  });

  it('persists default zoom only for desktop when no saved zoom exists', () => {
    expect(shouldPersistDefaultHeaderZoom(false, null)).toBe(true);
    expect(shouldPersistDefaultHeaderZoom(false, '0.8')).toBe(false);
    expect(shouldPersistDefaultHeaderZoom(true, null)).toBe(false);
  });

  it('builds rem zoom CSS values', () => {
    expect(buildHeaderZoomStyleValues(0.9)).toEqual({
      rootFontSize: '14.4px',
      bodyFontSize: '14.4px',
      zoomScale: '0.9',
    });
  });
});
