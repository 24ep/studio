import {
  DATE_ADVANCED_QUERY_FIELDS,
  NUMERIC_ADVANCED_QUERY_FIELDS,
  getUnknownAdvancedQueryFieldSuggestions,
  isValidAdvancedQueryField,
} from './applicant-advanced-query-fields';
import {
  getAdvancedQueryRawFieldParts,
  parseAdvancedQueryEntries,
} from './applicant-advanced-query-entry-utils';

export function validateAdvancedQuery(query: string): { isValid: boolean; error?: string; suggestions?: string[] } {
  if (!query.trim()) {
    return { isValid: true };
  }

  const entries = parseAdvancedQueryEntries(query);
  const rawParts = getAdvancedQueryRawFieldParts(query);

  if (entries.length !== rawParts.length) {
    return {
      isValid: false,
      error: 'Invalid advanced query syntax',
      suggestions: ['Use format field:value or field:"multi word value"'],
    };
  }

  for (const { key, value, raw } of entries) {
    const normalizedKey = key.toLowerCase();

    if (!isValidAdvancedQueryField(normalizedKey)) {
      return {
        isValid: false,
        error: `Unknown field: "${key}"`,
        suggestions: getUnknownAdvancedQueryFieldSuggestions(normalizedKey),
      };
    }

    if (NUMERIC_ADVANCED_QUERY_FIELDS.has(normalizedKey)) {
      const numValue = parseInt(value, 10);
      if (Number.isNaN(numValue) || numValue < 0) {
        return {
          isValid: false,
          error: `Invalid number for "${key}": "${value}"`,
          suggestions: ['Use a positive number (e.g., 80 for 80%)'],
        };
      }
    }

    if (DATE_ADVANCED_QUERY_FIELDS.has(normalizedKey)) {
      const dateValue = new Date(value);
      if (Number.isNaN(dateValue.getTime())) {
        return {
          isValid: false,
          error: `Invalid date for "${key}": "${value}"`,
          suggestions: ['Use format YYYY-MM-DD (e.g., 2024-01-15)'],
        };
      }
    }

    if (!raw.includes(':')) {
      return {
        isValid: false,
        error: `Invalid syntax: "${raw}". Use format "field:value"`,
        suggestions: ['Use format field:value (e.g., name:John)'],
      };
    }
  }

  return { isValid: true };
}
