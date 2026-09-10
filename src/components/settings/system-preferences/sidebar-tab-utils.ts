import type { SidebarColors } from './constants';
import {
  gradientStringToHslGradient,
  hslGradientToGradientString,
} from './color-utils';

export type SidebarColorTheme = 'Light' | 'Dark';

export interface SidebarColorControlKeys {
  suffix: 'L' | 'D';
  bgStartKey: keyof SidebarColors;
  bgEndKey: keyof SidebarColors;
  activeBgStartKey: keyof SidebarColors;
  activeBgEndKey: keyof SidebarColors;
  otherKeys: Array<keyof SidebarColors>;
  buttonTextKey: keyof SidebarColors;
}

export const SIDEBAR_COLOR_LABELS: Record<string, string> = {
  sidebarTextL: 'Font Color',
  sidebarActiveTextL: 'Active Text',
  sidebarHoverBgL: 'Hover Background',
  sidebarHoverTextL: 'Hover Text',
  sidebarBorderL: 'Border Color',
  sidebarTextD: 'Font Color',
  sidebarActiveTextD: 'Active Text',
  sidebarHoverBgD: 'Hover Background',
  sidebarHoverTextD: 'Hover Text',
  sidebarBorderD: 'Border Color',
};

export function getSidebarColorThemeSuffix(theme: SidebarColorTheme): 'L' | 'D' {
  return theme === 'Light' ? 'L' : 'D';
}

export function getSidebarColorControlKeys(theme: SidebarColorTheme): SidebarColorControlKeys {
  const suffix = getSidebarColorThemeSuffix(theme);

  return {
    suffix,
    bgStartKey: `sidebarBgStart${suffix}`,
    bgEndKey: `sidebarBgEnd${suffix}`,
    activeBgStartKey: `sidebarActiveBgStart${suffix}`,
    activeBgEndKey: `sidebarActiveBgEnd${suffix}`,
    otherKeys: [
      `sidebarText${suffix}`,
      `sidebarActiveText${suffix}`,
      `sidebarHoverBg${suffix}`,
      `sidebarHoverText${suffix}`,
      `sidebarBorder${suffix}`,
    ],
    buttonTextKey: `buttonTextColor${suffix}`,
  };
}

export function isSidebarGradientValue(value: string | null | undefined): boolean {
  return Boolean(
    value &&
      (value.startsWith('linear-gradient') ||
        value.startsWith('radial-gradient') ||
        value.startsWith('conic-gradient'))
  );
}

export function getSidebarGradientPickerValue(
  sidebarColors: SidebarColors,
  startKey: keyof SidebarColors,
  endKey: keyof SidebarColors
) {
  const storedGradient = sidebarColors[startKey];
  if (isSidebarGradientValue(storedGradient)) {
    return storedGradient;
  }

  return hslGradientToGradientString(sidebarColors[startKey] || '', sidebarColors[endKey] || '');
}

export function applySidebarGradientChange({
  sidebarColors,
  startKey,
  endKey,
  gradientString,
  syncSolidEnd = false,
}: {
  sidebarColors: SidebarColors;
  startKey: keyof SidebarColors;
  endKey: keyof SidebarColors;
  gradientString: string;
  syncSolidEnd?: boolean;
}) {
  const updated = { ...sidebarColors };
  const gradient = gradientStringToHslGradient(gradientString);

  updated[startKey] = gradientString;
  if (gradient) {
    updated[endKey] = gradient.end;
  } else if (syncSolidEnd && !isSidebarGradientValue(gradientString)) {
    updated[endKey] = gradientString;
  }

  return updated;
}
