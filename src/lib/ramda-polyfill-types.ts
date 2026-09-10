export type RamdaFunction = (...args: unknown[]) => unknown;
export type Predicate<T> = (value: T, index: number, array: T[]) => unknown;
export type Mapper<T, U> = (value: T, index: number, array: T[]) => U;
export type Reducer<T, U> = (accumulator: U, value: T, index: number, array: T[]) => U;
export type Comparator<T> = (left: T, right: T) => number;
export type UnknownRecord = Record<string, unknown>;

declare global {
  interface Window {
    R?: {
      filter?: RamdaFunction;
      map?: RamdaFunction;
      find?: RamdaFunction;
      prop?: RamdaFunction;
      path?: RamdaFunction;
      compose?: RamdaFunction;
      pipe?: RamdaFunction;
      curry?: RamdaFunction;
      [key: string]: RamdaFunction | undefined;
    };
  }
}
