import { collectionOperations } from './ramda-polyfill-collections';
import { functionOperations } from './ramda-polyfill-functions';
import { objectOperations } from './ramda-polyfill-object';

export const R = {
  ...collectionOperations,
  ...objectOperations,
  ...functionOperations,
};

export function safeFilter<T>(
  predicate: (value: T, index: number, array: T[]) => boolean,
  list: unknown
): T[] {
  return R.filter(predicate, list);
}

export function safeMap<T, U>(
  fn: (value: T, index: number, array: T[]) => U,
  list: unknown
): U[] {
  return R.map(fn, list);
}

export function safeFind<T>(
  predicate: (value: T, index: number, array: T[]) => boolean,
  list: unknown
): T | undefined {
  return R.find(predicate, list);
}
