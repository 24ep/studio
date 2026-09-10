import { describe, expect, it, vi } from 'vitest';
import {
  LOGO_SIZE_INPUT,
  LOGIN_LOGO_UPLOADS,
  PRIMARY_LOGO_UPLOAD,
  SIDEBAR_LOGO_UPLOADS,
  buildLoginLogoUploads,
  buildSidebarLogoUploads,
  formatLoginPageLogoSize,
  parseLoginPageLogoSize,
} from './branding-logo-management-utils';

describe('branding-logo-management-utils', () => {
  it('defines primary logo upload metadata', () => {
    expect(PRIMARY_LOGO_UPLOAD).toMatchObject({
      id: 'app-logo-upload',
      alt: 'Primary logo preview',
      emptyText: 'Click to upload',
    });
    expect(PRIMARY_LOGO_UPLOAD.recommendation).toContain('200x80px');
  });

  it('defines login logo upload metadata', () => {
    expect(LOGIN_LOGO_UPLOADS).toEqual([
      {
        label: 'Light Mode',
        id: 'login-logo-light-upload',
        alt: 'Login light mode logo',
      },
      {
        label: 'Dark Mode',
        id: 'login-logo-dark-upload',
        alt: 'Login dark mode logo',
      },
    ]);
  });

  it('defines sidebar logo upload metadata by mode', () => {
    expect(SIDEBAR_LOGO_UPLOADS.map(upload => upload.mode)).toEqual(['light', 'dark']);
    expect(SIDEBAR_LOGO_UPLOADS[0].collapsed).toMatchObject({
      label: 'Collapsed',
      id: 'sidebar-collapsed-light-upload',
    });
    expect(SIDEBAR_LOGO_UPLOADS[1].expanded).toMatchObject({
      label: 'Expanded',
      id: 'sidebar-expanded-dark-upload',
    });
  });

  it('formats and parses login page logo size values', () => {
    expect(LOGO_SIZE_INPUT).toEqual({ min: 40, max: 300, step: 10 });
    expect(parseLoginPageLogoSize('120')).toBe(120);
    expect(formatLoginPageLogoSize(120)).toBe('120px');
  });

  it('builds login logo upload configs with remove callbacks', () => {
    const setLightPreview = vi.fn();
    const setLightSaved = vi.fn();
    const uploads = buildLoginLogoUploads({
      darkPreviewUrl: '/dark.png',
      lightPreviewUrl: '/light.png',
      onDarkChange: vi.fn(),
      onLightChange: vi.fn(),
      setDarkPreviewUrl: vi.fn(),
      setLightPreviewUrl: setLightPreview,
      setSavedDarkUrl: vi.fn(),
      setSavedLightUrl: setLightSaved,
    });

    expect(uploads.map((upload) => upload.previewUrl)).toEqual(['/light.png', '/dark.png']);
    uploads[0].onRemove();
    expect(setLightPreview).toHaveBeenCalledWith(null);
    expect(setLightSaved).toHaveBeenCalledWith(null);
  });

  it('builds sidebar logo upload configs by light and dark mode', () => {
    const uploads = buildSidebarLogoUploads({
      collapsedDarkPreviewUrl: '/collapsed-dark.png',
      collapsedLightPreviewUrl: '/collapsed-light.png',
      expandedDarkPreviewUrl: '/expanded-dark.png',
      expandedLightPreviewUrl: '/expanded-light.png',
      onCollapsedDarkChange: vi.fn(),
      onCollapsedLightChange: vi.fn(),
      onExpandedDarkChange: vi.fn(),
      onExpandedLightChange: vi.fn(),
      setCollapsedDarkPreviewUrl: vi.fn(),
      setCollapsedLightPreviewUrl: vi.fn(),
      setExpandedDarkPreviewUrl: vi.fn(),
      setExpandedLightPreviewUrl: vi.fn(),
      setSavedCollapsedDarkUrl: vi.fn(),
      setSavedCollapsedLightUrl: vi.fn(),
      setSavedExpandedDarkUrl: vi.fn(),
      setSavedExpandedLightUrl: vi.fn(),
    });

    expect(uploads.map((upload) => upload.mode)).toEqual(['light', 'dark']);
    expect(uploads[0].collapsed.previewUrl).toBe('/collapsed-light.png');
    expect(uploads[0].expanded.previewUrl).toBe('/expanded-light.png');
    expect(uploads[1].collapsed.previewUrl).toBe('/collapsed-dark.png');
    expect(uploads[1].expanded.previewUrl).toBe('/expanded-dark.png');
  });
});
