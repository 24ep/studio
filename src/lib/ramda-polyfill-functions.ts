import type { RamdaFunction } from './ramda-polyfill-types';
import { identity, runWithFallback } from './ramda-polyfill-utils';

function getValidUnaryFunctions(fns: unknown[]): Array<(value: unknown) => unknown> {
  return fns.filter((fn): fn is (value: unknown) => unknown => typeof fn === 'function');
}

export const functionOperations = {
  compose: (...fns: unknown[]): ((value: unknown) => unknown) =>
    runWithFallback('R.compose: error creating composition, returning identity function', () => {
      const validFns = getValidUnaryFunctions(fns);
      if (validFns.length === 0) {
        return identity;
      }

      return (value: unknown) => validFns.reduceRight((acc, fn) => fn(acc), value);
    }, identity),

  pipe: (...fns: unknown[]): ((value: unknown) => unknown) =>
    runWithFallback('R.pipe: error creating pipe, returning identity function', () => {
      const validFns = getValidUnaryFunctions(fns);
      if (validFns.length === 0) {
        return identity;
      }

      return (value: unknown) => validFns.reduce((acc, fn) => fn(acc), value);
    }, identity),

  curry: (fn: unknown): RamdaFunction =>
    runWithFallback('R.curry: error creating curried function, returning identity function', () => {
      if (typeof fn !== 'function') {
        console.warn('R.curry: argument is not a function, returning identity function');
        return identity;
      }

      const arity = fn.length;
      return function curried(this: unknown, ...args: unknown[]): unknown {
        if (args.length >= arity) {
          return fn.apply(this, args);
        }

        return function collectMoreArgs(this: unknown, ...moreArgs: unknown[]) {
          return curried.apply(this, args.concat(moreArgs));
        };
      };
    }, identity),
};
