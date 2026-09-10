import { describe, expect, it } from 'vitest';
import { createInitialSidebarColors } from './constants';
import {
  SIDEBAR_COLOR_LABELS,
  applySidebarGradientChange,
  getSidebarColorControlKeys,
  getSidebarColorThemeSuffix,
  getSidebarGradientPickerValue,
  isSidebarGradientValue,
} from './sidebar-tab-utils';

describe('sidebar-tab-utils', () => {
  it('builds sidebar color keys for light and dark themes', () => {
    expect(getSidebarColorThemeSuffix('Light')).toBe('L');
    expect(getSidebarColorThemeSuffix('Dark')).toBe('D');

    expect(getSidebarColorControlKeys('Light')).toMatchObject({
      suffix: 'L',
      bgStartKey: 'sidebarBgStartL',
      bgEndKey: 'sidebarBgEndL',
      activeBgStartKey: 'sidebarActiveBgStartL',
      activeBgEndKey: 'sidebarActiveBgEndL',
      buttonTextKey: 'buttonTextColorL',
    });
    expect(getSidebarColorControlKeys('Dark').otherKeys).toEqual([
      'sidebarTextD',
      'sidebarActiveTextD',
      'sidebarHoverBgD',
      'sidebarHoverTextD',
      'sidebarBorderD',
    ]);
    expect(SIDEBAR_COLOR_LABELS.sidebarTextL).toBe('Font Color');
  });

  it('detects stored gradient values', () => {
    expect(isSidebarGradientValue('linear-gradient(135deg, red 0%, blue 100%)')).toBe(true);
    expect(isSidebarGradientValue('radial-gradient(circle, red 0%, blue 100%)')).toBe(true);
    expect(isSidebarGradientValue('conic-gradient(red, blue)')).toBe(true);
    expect(isSidebarGradientValue('220 25% 97%')).toBe(false);
    expect(isSidebarGradientValue(null)).toBe(false);
  });

  it('uses stored gradients before deriving one from start and end colors', () => {
    const sidebarColors = createInitialSidebarColors();
    const storedGradient = 'linear-gradient(135deg, #111111 0%, #222222 100%)';

    expect(getSidebarGradientPickerValue({
      ...sidebarColors,
      sidebarBgStartL: storedGradient,
      sidebarBgEndL: '220 20% 94%',
    }, 'sidebarBgStartL', 'sidebarBgEndL')).toBe(storedGradient);

    expect(getSidebarGradientPickerValue(sidebarColors, 'sidebarBgStartL', 'sidebarBgEndL')).toMatch(/^linear-gradient/);
  });

  it('applies gradient updates immutably and preserves parsed end colors', () => {
    const sidebarColors = createInitialSidebarColors();
    const updated = applySidebarGradientChange({
      sidebarColors,
      startKey: 'sidebarBgStartL',
      endKey: 'sidebarBgEndL',
      gradientString: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)',
    });

    expect(updated).not.toBe(sidebarColors);
    expect(updated.sidebarBgStartL).toMatch(/^linear-gradient/);
    expect(updated.sidebarBgEndL).toBe('240 100% 50%');
    expect(sidebarColors.sidebarBgEndL).not.toBe('240 100% 50%');
  });

  it('syncs active solid gradient end only when requested', () => {
    const sidebarColors = createInitialSidebarColors();

    expect(applySidebarGradientChange({
      sidebarColors,
      startKey: 'sidebarBgStartL',
      endKey: 'sidebarBgEndL',
      gradientString: '220 25% 97%',
    }).sidebarBgEndL).toBe(sidebarColors.sidebarBgEndL);

    expect(applySidebarGradientChange({
      sidebarColors,
      startKey: 'sidebarActiveBgStartL',
      endKey: 'sidebarActiveBgEndL',
      gradientString: '220 25% 97%',
      syncSolidEnd: true,
    }).sidebarActiveBgEndL).toBe('220 25% 97%');
  });
});
