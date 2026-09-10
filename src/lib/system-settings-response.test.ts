import { describe, expect, it } from 'vitest';
import {
  getSystemSettingEnum,
  getSystemSettingString,
  isPwaEnabledFromSettings,
  isSystemSettingEnabled,
  normalizeSystemSettingsResponse,
} from './system-settings-response';

describe('system-settings-response', () => {
  it('normalizes array and object response formats', () => {
    expect(
      normalizeSystemSettingsResponse({
        settings: [
          { key: 'pwaEnabled', value: 'true' },
          { key: 'appName', value: 'Studio' },
        ],
      })
    ).toEqual({ pwaEnabled: 'true', appName: 'Studio' });
    expect(normalizeSystemSettingsResponse({ pwaEnabled: 'false' })).toEqual({ pwaEnabled: 'false' });
    expect(normalizeSystemSettingsResponse(null)).toEqual({});
  });

  it('ignores malformed array entries', () => {
    expect(
      normalizeSystemSettingsResponse({
        settings: [
          { key: 'appName', value: 'Studio' },
          { value: 'missing key' },
          { key: '   ', value: 'blank key' },
          null,
        ],
      })
    ).toEqual({ appName: 'Studio' });
  });

  it('detects enabled PWA settings', () => {
    expect(isPwaEnabledFromSettings({ settings: [{ key: 'pwaEnabled', value: 'true' }] })).toBe(true);
    expect(isPwaEnabledFromSettings({ pwaEnabled: 'false' })).toBe(false);
  });

  it('reads string and enum settings with fallbacks', () => {
    const data = {
      settings: [
        { key: 'drawerStyle', value: 'modern' },
        { key: 'blank', value: '   ' },
        { key: 'badMode', value: 'plain-text' },
      ],
    };

    expect(getSystemSettingString(data, 'drawerStyle')).toBe('modern');
    expect(getSystemSettingString(data, 'blank')).toBeUndefined();
    expect(getSystemSettingEnum(data, 'drawerStyle', ['classic', 'modern'] as const, 'classic')).toBe('modern');
    expect(getSystemSettingEnum(data, 'badMode', ['wysiwyg', 'html'] as const, 'wysiwyg')).toBe('wysiwyg');
  });

  it('reads feature flags with explicit false and default fallback handling', () => {
    expect(isSystemSettingEnabled({ jobMatchFeatureEnabled: 'false' }, 'jobMatchFeatureEnabled', true)).toBe(false);
    expect(isSystemSettingEnabled({ jobMatchFeatureEnabled: false }, 'jobMatchFeatureEnabled', true)).toBe(false);
    expect(isSystemSettingEnabled({ jobMatchFeatureEnabled: 'true' }, 'jobMatchFeatureEnabled', false)).toBe(true);
    expect(isSystemSettingEnabled({}, 'jobMatchFeatureEnabled', true)).toBe(true);
  });
});
