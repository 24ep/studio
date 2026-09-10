import { describe, expect, it } from 'vitest';
import { ensureArray, ensureObject, R, safeFilter, safeFind, safeMap } from './ramda-polyfill';

describe('ramda polyfill', () => {
  it('normalizes arrays and objects safely', () => {
    expect(ensureArray<number>([1, 2])).toEqual([1, 2]);
    expect(ensureArray<number>(null)).toEqual([]);
    expect(ensureArray<string>({ 0: 'a', 1: 'b', length: 2 })).toEqual(['a', 'b']);
    expect(ensureObject({ id: 1 })).toEqual({ id: 1 });
    expect(ensureObject(['x'])).toEqual({});
  });

  it('runs safe collection operations', () => {
    expect(safeFilter<number>((value) => value > 1, [1, 2, 3])).toEqual([2, 3]);
    expect(safeMap<number, number>((value) => value * 2, [1, 2])).toEqual([2, 4]);
    expect(safeFind<number>((value) => value === 2, [1, 2, 3])).toBe(2);
    expect(R.reduce<number, number>((sum: number, value: number) => sum + value, 0, [1, 2, 3])).toBe(6);
  });

  it('handles path, composition, and invalid callbacks', () => {
    expect(R.path(['profile', 'name'], { profile: { name: 'Ari' } })).toBe('Ari');
    expect(R.pipe((value: unknown) => Number(value) + 1, (value: unknown) => Number(value) * 2)(3)).toBe(8);
    expect(R.compose((value: unknown) => Number(value) + 1, (value: unknown) => Number(value) * 2)(3)).toBe(7);
    expect(R.filter('bad predicate', [1, 2])).toEqual([1, 2]);
    expect(R.every('bad predicate', [1, 2])).toBe(true);
  });
});
