import { ensureObject } from './ramda-polyfill-guards';
import type { UnknownRecord } from './ramda-polyfill-types';
import { runWithFallback } from './ramda-polyfill-utils';

export const objectOperations = {
  prop: (prop: string, obj: unknown): unknown =>
    runWithFallback('R.prop: error accessing property, returning undefined', () => ensureObject(obj)[prop], undefined),

  path: (path: string[], obj: unknown): unknown =>
    runWithFallback('R.path: error accessing path, returning undefined', () => {
      if (!Array.isArray(path) || !obj) {
        return undefined;
      }

      return path.reduce<unknown>((current, key) => {
        if (!current || typeof current !== 'object') {
          return undefined;
        }

        const currentRecord = current as UnknownRecord;
        return currentRecord[key] !== undefined ? currentRecord[key] : undefined;
      }, obj);
    }, undefined),
};
