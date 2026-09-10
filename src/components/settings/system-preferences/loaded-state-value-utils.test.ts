import { describe, expect, it } from 'vitest';

import {
  asBooleanPreference,
  asNumberPreference,
  asStringOrNull,
  buildGradientPreference,
  buildLoadedSidebarColors,
} from './loaded-state-value-utils';

describe('loaded-state value utilities', () => {
  it('coerces scalar preference values', () => {
    expect(asStringOrNull('logo')).toBe('logo');
    expect(asStringOrNull('')).toBeNull();
    expect(asBooleanPreference('true')).toBe(true);
    expect(asBooleanPreference(false)).toBe(false);
    expect(asNumberPreference('42', 10)).toBe(42);
    expect(asNumberPreference('bad', 10)).toBe(10);
  });

  it('builds gradients from full, split, or fallback values', () => {
    expect(buildGradientPreference({
      gradient: 'linear-gradient(red, blue)',
    }, 'gradient', 'start', 'end')).toBe('linear-gradient(red, blue)');

    expect(buildGradientPreference({
      start: '1 2% 3%',
      end: '4 5% 6%',
    }, 'gradient', 'start', 'end')).toBe('linear-gradient(135deg, #080807 0%, #100f0f 100%)');

    expect(buildGradientPreference({}, 'gradient', 'start', 'end', '7 8% 9%', '10 11% 12%')).toBe(
      'linear-gradient(135deg, #191615 0%, #221c1b 100%)'
    );
  });

  it('overlays sidebar color settings on defaults', () => {
    const colors = buildLoadedSidebarColors({
      sidebarBgStartL: '220 25% 97%',
      notSidebarColor: 'ignored',
    });

    expect(colors.sidebarBgStartL).toBe('220 25% 97%');
    expect(colors.sidebarTextL).toEqual(expect.any(String));
  });
});
