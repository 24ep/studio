import { ensureArray } from './ramda-polyfill-guards';
import type {
  Comparator,
  Mapper,
  Predicate,
  Reducer,
} from './ramda-polyfill-types';
import { runWithFallback } from './ramda-polyfill-utils';

export const collectionOperations = {
  filter: <T>(predicate: unknown, list: unknown): T[] =>
    runWithFallback('R.filter: error during filtering, returning empty array', () => {
      const safeList = ensureArray<T>(list);
      if (typeof predicate !== 'function') {
        console.warn('R.filter: predicate is not a function, returning original array');
        return safeList;
      }

      const filterPredicate = predicate as Predicate<T>;
      return safeList.filter((value, index, array) => Boolean(filterPredicate(value, index, array)));
    }, []),

  map: <T, U>(fn: unknown, list: unknown): U[] =>
    runWithFallback('R.map: error during mapping, returning empty array', () => {
      const safeList = ensureArray<T>(list);
      if (typeof fn !== 'function') {
        console.warn('R.map: mapper is not a function, returning original array');
        return safeList as unknown as U[];
      }

      const mapper = fn as Mapper<T, U>;
      return safeList.map((value, index, array) => mapper(value, index, array));
    }, []),

  find: <T>(predicate: unknown, list: unknown): T | undefined =>
    runWithFallback('R.find: error during finding, returning undefined', () => {
      const safeList = ensureArray<T>(list);
      if (typeof predicate !== 'function') {
        console.warn('R.find: predicate is not a function, returning undefined');
        return undefined;
      }

      const findPredicate = predicate as Predicate<T>;
      return safeList.find((value, index, array) => Boolean(findPredicate(value, index, array)));
    }, undefined),

  reduce: <T, U>(fn: unknown, initial: U, list: unknown): U =>
    runWithFallback('R.reduce: error during reduction, returning initial value', () => {
      const safeList = ensureArray<T>(list);
      if (typeof fn !== 'function') {
        console.warn('R.reduce: reducer is not a function, returning initial value');
        return initial;
      }

      const reducer = fn as Reducer<T, U>;
      return safeList.reduce((accumulator, value, index, array) => reducer(accumulator, value, index, array), initial);
    }, initial),

  some: <T>(predicate: unknown, list: unknown): boolean =>
    runWithFallback('R.some: error during some check, returning false', () => {
      const safeList = ensureArray<T>(list);
      if (typeof predicate !== 'function') {
        console.warn('R.some: predicate is not a function, returning false');
        return false;
      }

      const somePredicate = predicate as Predicate<T>;
      return safeList.some((value, index, array) => Boolean(somePredicate(value, index, array)));
    }, false),

  every: <T>(predicate: unknown, list: unknown): boolean =>
    runWithFallback('R.every: error during every check, returning true', () => {
      const safeList = ensureArray<T>(list);
      if (typeof predicate !== 'function') {
        console.warn('R.every: predicate is not a function, returning true');
        return true;
      }

      const everyPredicate = predicate as Predicate<T>;
      return safeList.every((value, index, array) => Boolean(everyPredicate(value, index, array)));
    }, true),

  flatten: (list: unknown): unknown[] =>
    runWithFallback('R.flatten: error during flattening, returning empty array', () => ensureArray(list).flat(Infinity), []),

  uniq: <T>(list: unknown): T[] =>
    runWithFallback('R.uniq: error during deduplication, returning empty array', () => [...new Set(ensureArray<T>(list))], []),

  sort: <T>(comparator: unknown, list: unknown): T[] =>
    runWithFallback('R.sort: error during sorting, returning original array', () => {
      const safeList = ensureArray<T>(list);
      if (typeof comparator !== 'function') {
        console.warn('R.sort: comparator is not a function, returning sorted array with default comparator');
        return [...safeList].sort();
      }

      return [...safeList].sort(comparator as Comparator<T>);
    }, ensureArray<T>(list)),
};
