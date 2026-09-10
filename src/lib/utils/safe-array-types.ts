export type Predicate<T> = (value: T, index: number, array: T[]) => boolean;
export type Mapper<T, U> = (value: T, index: number, array: T[]) => U;
export type Reducer<T, U> = (accumulator: U, value: T, index: number, array: T[]) => U;

export interface SafeArrayApi {
  ensureArray: <T>(value: unknown) => T[];
  filter: <T>(array: unknown, predicate: Predicate<T>) => T[];
  map: <T, U>(array: unknown, mapper: Mapper<T, U>) => U[];
  find: <T>(array: unknown, predicate: Predicate<T>) => T | undefined;
  some: <T>(array: unknown, predicate: Predicate<T>) => boolean;
  every: <T>(array: unknown, predicate: Predicate<T>) => boolean;
  reduce: <T, U>(array: unknown, reducer: Reducer<T, U>, initialValue: U) => U;
  forEach: <T>(array: unknown, callback: (value: T, index: number, array: T[]) => void) => void;
  slice: <T>(array: unknown, start?: number, end?: number) => T[];
  length: (array: unknown) => number;
  includes: <T>(array: unknown, searchElement: T, fromIndex?: number) => boolean;
  indexOf: <T>(array: unknown, searchElement: T, fromIndex?: number) => number;
  safeFilter: <T>(array: unknown, predicate: Predicate<T>, context?: string) => T[];
  debugFilterError: (array: unknown, context: string) => void;
}
