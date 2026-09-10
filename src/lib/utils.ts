/**
 * Utils
 * 
 * This file re-exports all functions from the utils module for backward compatibility.
 * New code can continue to import from '@/lib/utils' as this is the canonical location.
 * 
 * @module utils
 */

// Re-export everything from the utils module
export {
  // Core utilities
  cn,
  containsThaiText,
  getFontClass,
  getFontFamily,
  ensureArray,
  safeJsonParse,

  // Formatting utilities
  formatFileSize,
  formatDate,
  formatDateTime,
  isValidDate,
  safeToDate,
  safeGetDateFromRange,
  safeFormatDate,
  safeGetTimeWithFallback,
  safeGetTime,
  safeDateDiff,
  safeDateCompare,
  calculateDuration,

  // Safe array utilities
  reactSafeArray,
  safeArrayUtils,
  safeFilter,
  safeMap,
  safeFind,
  safeSome,
  safeEvery,
  safeReduce,
  safeForEach,
  safeSlice,
  safeLength,
  safeIncludes,
  safeIndexOf,
  reactSafeFilter,
  reactSafeMap,
  reactSafeFind,
  reactSafeSome,
  reactSafeEvery,
  reactSafeReduce,
  reactSafeForEach,
  reactSafeSlice,
  reactSafeLength,
  reactSafeIncludes,
  reactSafeIndexOf,

  // External module re-exports
  sanitizeHtml,
  sanitizeRichHtml,
  sanitizeUrl,
  formatScoreWithGrade,
} from './utils/index';
