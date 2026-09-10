import {
  createSafeArrayApi,
  ensureArray,
} from './safe-array-api';

/**
 * React-specific safe array utilities with enhanced error handling.
 */
export const reactSafeArray = createSafeArrayApi('reactSafeArray');

/**
 * General safe array utilities.
 */
export const safeArrayUtils = createSafeArrayApi('safeArrayUtils');

// Export individual functions for convenience
export const safeFilter = safeArrayUtils.filter;
export const safeMap = safeArrayUtils.map;
export const safeFind = safeArrayUtils.find;
export const safeSome = safeArrayUtils.some;
export const safeEvery = safeArrayUtils.every;
export const safeReduce = safeArrayUtils.reduce;
export const safeForEach = safeArrayUtils.forEach;
export const safeSlice = safeArrayUtils.slice;
export const safeLength = safeArrayUtils.length;
export const safeIncludes = safeArrayUtils.includes;
export const safeIndexOf = safeArrayUtils.indexOf;

// React-specific exports
export const reactSafeFilter = reactSafeArray.filter;
export const reactSafeMap = reactSafeArray.map;
export const reactSafeFind = reactSafeArray.find;
export const reactSafeSome = reactSafeArray.some;
export const reactSafeEvery = reactSafeArray.every;
export const reactSafeReduce = reactSafeArray.reduce;
export const reactSafeForEach = reactSafeArray.forEach;
export const reactSafeSlice = reactSafeArray.slice;
export const reactSafeLength = reactSafeArray.length;
export const reactSafeIncludes = reactSafeArray.includes;
export const reactSafeIndexOf = reactSafeArray.indexOf;

export { ensureArray };
export type {
  Mapper,
  Predicate,
  Reducer,
  SafeArrayApi,
} from './safe-array-types';
