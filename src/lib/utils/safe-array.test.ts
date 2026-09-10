import { describe, expect, it, vi } from 'vitest';
import { reactSafeArray, safeArrayUtils, safeFilter, safeMap } from './safe-array';

describe('safe array utilities', () => {
  it('normalizes nullish and array-like values', () => {
    expect(safeArrayUtils.ensureArray(null)).toEqual([]);
    expect(safeArrayUtils.ensureArray({ 0: 'a', 1: 'b', length: 2 })).toEqual(['a', 'b']);
  });

  it('preserves convenience exports', () => {
    expect(safeFilter<number>([1, 2, 3], value => value > 1)).toEqual([2, 3]);
    expect(safeMap<number, number>([1, 2], value => value * 2)).toEqual([2, 4]);
    expect(safeArrayUtils.find<number>([1, 2, 3], value => value === 2)).toBe(2);
    expect(safeArrayUtils.some<number>([1, 2, 3], value => value > 2)).toBe(true);
    expect(safeArrayUtils.reduce<number, number>([1, 2, 3], (sum, value) => sum + value, 0)).toBe(6);
    expect(safeArrayUtils.length({ 0: 'x', length: 1 })).toBe(1);
  });

  it('returns fallbacks when callbacks throw', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(reactSafeArray.filter([1], () => {
      throw new Error('boom');
    })).toEqual([]);
    expect(reactSafeArray.every([1], () => {
      throw new Error('boom');
    })).toBe(true);

    warn.mockRestore();
  });

  it('logs debug info for arbitrary non-array values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const circular: { self?: unknown } = {};
    circular.self = circular;

    safeArrayUtils.debugFilterError(circular, 'circular-context');
    expect(warn).toHaveBeenCalledWith('Filter error debug info:', expect.objectContaining({
      context: 'circular-context',
      sample: '[Unserializable object]',
    }));

    warn.mockRestore();
  });
});
