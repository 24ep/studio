import { describe, expect, it } from 'vitest';
import {
  APPEARANCE_DEVICE_TABS,
  DRAWER_STYLE_OPTIONS,
  LOGIN_BACKGROUND_TYPE_OPTIONS,
  LOGIN_LAYOUT_OPTIONS,
  getAppearanceDeviceTabClass,
  getDefaultLoginBackgroundGradient,
  getDrawerStylePreviewText,
} from './appearance-tab-utils';

describe('appearance-tab-utils', () => {
  it('defines stable select options for appearance settings', () => {
    expect(APPEARANCE_DEVICE_TABS).toEqual([
      { value: 'desktop', label: 'Desktop' },
      { value: 'mobile', label: 'Mobile' },
    ]);
    expect(LOGIN_BACKGROUND_TYPE_OPTIONS.map(option => option.value)).toEqual([
      'gradient',
      'image',
      'solid',
    ]);
    expect(LOGIN_LAYOUT_OPTIONS.map(option => option.value)).toEqual(['center', '2column']);
    expect(DRAWER_STYLE_OPTIONS.map(option => option.value)).toEqual(['classic', 'modern']);
  });

  it('builds active and inactive device tab classes', () => {
    expect(getAppearanceDeviceTabClass(true)).toContain('text-primary');
    expect(getAppearanceDeviceTabClass(true)).toContain('after:bg-primary');
    expect(getAppearanceDeviceTabClass(false)).toContain('text-muted-foreground');
    expect(getAppearanceDeviceTabClass(false)).toContain('hover:text-foreground');
  });

  it('builds the default login background gradient', () => {
    expect(getDefaultLoginBackgroundGradient()).toMatch(/^linear-gradient/);
  });

  it('describes drawer style previews', () => {
    expect(getDrawerStylePreviewText('classic')).toBe('- Drawers slide in from the side and take full height');
    expect(getDrawerStylePreviewText('modern')).toBe(
      '- Drawers appear as modal-like panels on the right side with margins and rounded corners'
    );
  });
});
