import type { ColorValue, GradientStop } from './enhanced-color-picker-types';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => {
      const hex = value.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;
}

export function hexToRgba(hex: string, opacity = 100): string {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return `rgba(0, 0, 0, ${opacity / 100})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
}

export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function normalizeHex(hex: string): string {
  if (!hex) {
    return '#000000';
  }

  if (hex.startsWith('#')) {
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    return hex.length === 7 ? hex : '#000000';
  }

  const prefixedHex = `#${hex}`;
  return prefixedHex.length === 7 ? prefixedHex : '#000000';
}

export function clampColorPickerPercent(value: string | number, fallback = 100) {
  const parsedValue = typeof value === 'number' ? value : parseInt(value);
  return Math.max(0, Math.min(100, Number.isNaN(parsedValue) ? fallback : parsedValue));
}

export function getSolidOpacity(colorValue: ColorValue) {
  return colorValue.solidOpacity !== undefined ? colorValue.solidOpacity : 100;
}

export function getGradientStopOpacity(stop: GradientStop) {
  return stop.opacity !== undefined ? stop.opacity : 100;
}
