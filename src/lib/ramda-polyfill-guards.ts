import type { UnknownRecord } from './ramda-polyfill-types';

export function ensureArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'object') {
    try {
      return Array.from(value as Iterable<T> | ArrayLike<T>);
    } catch {
      return [];
    }
  }

  return [];
}

export function ensureObject(value: unknown): UnknownRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return {};
}
