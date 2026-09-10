import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getThemeSystemSettingsCache,
  updateThemeSystemSettingsCache,
} from './system-settings-cache';

describe('theme system settings cache', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null and skips updates when window is unavailable', () => {
    vi.stubGlobal('window', undefined);

    expect(getThemeSystemSettingsCache()).toBeNull();
    expect(updateThemeSystemSettingsCache({ appName: 'Studio' })).toBe(false);
  });

  it('returns false when the global settings cache has not been initialized', () => {
    vi.stubGlobal('window', {});

    expect(getThemeSystemSettingsCache()).toBeNull();
    expect(updateThemeSystemSettingsCache({ appName: 'Studio' })).toBe(false);
  });

  it('merges settings into the initialized global cache', () => {
    const testWindow = {
      __systemSettings: {
        appName: 'Studio',
      },
    };
    vi.stubGlobal('window', testWindow);

    expect(updateThemeSystemSettingsCache({
      appName: 'HRI',
      sidebarBackgroundType: 'image',
    })).toBe(true);
    expect(getThemeSystemSettingsCache()).toEqual({
      appName: 'HRI',
      sidebarBackgroundType: 'image',
    });
  });
});
