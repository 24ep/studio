import { debugFilterError, isArrayLikeObject } from "./safe-array-debug";
import type {
  Mapper,
  Predicate,
  Reducer,
  SafeArrayApi,
} from "./safe-array-types";

export const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined) return [];
  if (isArrayLikeObject<T>(value)) {
    return Array.from(value);
  }
  return [];
};

function runSafely<T, R>(
  label: string,
  operation: (array: T[]) => R,
  array: unknown,
  fallback: R,
): R {
  try {
    return operation(ensureArray<T>(array));
  } catch (error) {
    console.warn(`${label} error:`, error);
    return fallback;
  }
}

export function createSafeArrayApi(namespace: string): SafeArrayApi {
  return {
    ensureArray,

    filter: <T>(array: unknown, predicate: Predicate<T>): T[] =>
      runSafely<T, T[]>(`${namespace}.filter`, safeArr => safeArr.filter(predicate), array, []),

    map: <T, U>(array: unknown, mapper: Mapper<T, U>): U[] =>
      runSafely<T, U[]>(`${namespace}.map`, safeArr => safeArr.map(mapper), array, []),

    find: <T>(array: unknown, predicate: Predicate<T>): T | undefined =>
      runSafely<T, T | undefined>(`${namespace}.find`, safeArr => safeArr.find(predicate), array, undefined),

    some: <T>(array: unknown, predicate: Predicate<T>): boolean =>
      runSafely<T, boolean>(`${namespace}.some`, safeArr => safeArr.some(predicate), array, false),

    every: <T>(array: unknown, predicate: Predicate<T>): boolean =>
      runSafely<T, boolean>(`${namespace}.every`, safeArr => safeArr.every(predicate), array, true),

    reduce: <T, U>(array: unknown, reducer: Reducer<T, U>, initialValue: U): U =>
      runSafely<T, U>(`${namespace}.reduce`, safeArr => safeArr.reduce(reducer, initialValue), array, initialValue),

    forEach: <T>(array: unknown, callback: (value: T, index: number, array: T[]) => void): void =>
      runSafely<T, void>(`${namespace}.forEach`, safeArr => safeArr.forEach(callback), array, undefined),

    slice: <T>(array: unknown, start?: number, end?: number): T[] =>
      runSafely<T, T[]>(`${namespace}.slice`, safeArr => safeArr.slice(start, end), array, []),

    length: (array: unknown): number =>
      runSafely<unknown, number>(`${namespace}.length`, safeArr => safeArr.length, array, 0),

    includes: <T>(array: unknown, searchElement: T, fromIndex?: number): boolean =>
      runSafely<T, boolean>(`${namespace}.includes`, safeArr => safeArr.includes(searchElement, fromIndex), array, false),

    indexOf: <T>(array: unknown, searchElement: T, fromIndex?: number): number =>
      runSafely<T, number>(`${namespace}.indexOf`, safeArr => safeArr.indexOf(searchElement, fromIndex), array, -1),

    safeFilter: <T>(array: unknown, predicate: Predicate<T>, _context?: string): T[] =>
      runSafely<T, T[]>(`${namespace}.safeFilter`, safeArr => safeArr.filter(predicate), array, []),

    debugFilterError,
  };
}
