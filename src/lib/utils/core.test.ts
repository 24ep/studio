import { describe, expect, it, vi } from 'vitest';

import { ensureArray, safeJsonParse } from './core';

describe('core utils', () => {
  it('returns arrays only when the input is already an array', () => {
    expect(ensureArray([1, 2])).toEqual([1, 2]);
    expect(ensureArray(null)).toEqual([]);
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('parses JSON strings and preserves pre-parsed objects', () => {
    expect(safeJsonParse('{"enabled":true}', { enabled: false })).toEqual({ enabled: true });

    const value = { enabled: true };
    expect(safeJsonParse(value, { enabled: false })).toBe(value);
  });

  it('returns the fallback for empty, non-string primitive, and malformed values', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(safeJsonParse('', { fallback: true })).toEqual({ fallback: true });
    expect(safeJsonParse(123, { fallback: true })).toEqual({ fallback: true });
    expect(safeJsonParse('{bad json', { fallback: true })).toEqual({ fallback: true });
    expect(consoleSpy).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });
});
