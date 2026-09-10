import { DEFAULT_APP_NAME } from './constants';

const LEGACY_APP_NAMES = new Set(['hrive', 'fitscan', 'hri']);

export function normalizeAppName(value: unknown, fallback = DEFAULT_APP_NAME) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return fallback;
  }

  return LEGACY_APP_NAMES.has(trimmedValue.toLowerCase()) ? DEFAULT_APP_NAME : trimmedValue;
}
