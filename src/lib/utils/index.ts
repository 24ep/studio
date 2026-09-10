/**
 * Utils Module
 * 
 * This module provides common utility functions including:
 * 
 * - Core utilities (cn, Thai text detection, JSON parsing)
 * - Formatting utilities (dates, file sizes)
 * - Safe array utilities (error-safe array operations)
 * 
 * @module utils
 */

// Re-export core utilities
export {
  cn,
  containsThaiText,
  getFontClass,
  getFontFamily,
  ensureArray,
  safeJsonParse,
} from './core';

// Re-export formatting utilities
export {
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
} from './format';

// Re-export safe array utilities
export {
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
} from './safe-array';

// Re-export from external modules for convenience
export { sanitizeHtml, sanitizeRichHtml, sanitizeUrl } from '@/lib/security';
export { formatScoreWithGrade } from '@/lib/scoreUtils';
