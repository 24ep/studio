import {
  SIDEBAR_COLOR_KEYS,
  createInitialSidebarColors,
  type SidebarColors,
} from './constants';
import { hslGradientToGradientString } from './color-utils';

export type SettingsRecord = Record<string, unknown>;

export function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

export function asBooleanPreference(value: unknown): boolean {
  return value === true || value === 'true';
}

export function asNumberPreference(value: unknown, fallback: number): number {
  const parsedValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function buildGradientPreference(
  settings: SettingsRecord,
  gradientKey: string,
  startKey: string,
  endKey: string,
  fallbackStart?: string,
  fallbackEnd?: string
): string | null {
  const fullGradient = asStringOrNull(settings[gradientKey]);
  if (fullGradient) return fullGradient;

  const start = asStringOrNull(settings[startKey]);
  const end = asStringOrNull(settings[endKey]);
  if (start && end) return hslGradientToGradientString(start, end);

  if (fallbackStart && fallbackEnd) {
    return hslGradientToGradientString(fallbackStart, fallbackEnd);
  }

  return null;
}

export function buildLoadedSidebarColors(settings: SettingsRecord): SidebarColors {
  const sidebarColors: SidebarColors = createInitialSidebarColors();
  SIDEBAR_COLOR_KEYS.forEach(key => {
    const value = asStringOrNull(settings[key]);
    if (value) {
      sidebarColors[key] = value;
    }
  });
  return sidebarColors;
}
