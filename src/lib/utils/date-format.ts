import { format } from 'date-fns';

export type DateInput = string | number | Date | null | undefined;

type DateRangeLike = Partial<Record<'from' | 'to', DateInput>>;
type DateFormatOptions = Intl.DateTimeFormatOptions;

const DISPLAY_DATE_OPTIONS: DateFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};
const DISPLAY_DATE_TIME_OPTIONS: DateFormatOptions = {
  ...DISPLAY_DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Format date to localized string
 */
export function formatDate(date: string | Date | null): string {
  return formatDisplayDate(date, DISPLAY_DATE_OPTIONS);
}

/**
 * Format date and time to localized string
 */
export function formatDateTime(date: string | Date | null): string {
  return formatDisplayDate(date, DISPLAY_DATE_TIME_OPTIONS);
}

/**
 * Validates if a value is a valid Date object
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely converts a value to a Date object
 */
export function safeToDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isValidDate(date) ? date : null;
  }

  return null;
}

/**
 * Safely gets a Date object from a date range property
 */
export function safeGetDateFromRange(dateRange: unknown, property: 'from' | 'to'): Date | null {
  if (!isDateRangeLike(dateRange)) {
    return null;
  }

  const value = dateRange[property];
  return safeToDate(value);
}

/**
 * Safely formats a date with fallback
 */
export function safeFormatDate(date: unknown, formatStr: string, fallback: string = '-'): string {
  const dateObj = safeToDate(date);
  if (!dateObj) {
    return fallback;
  }

  try {
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('safeFormatDate: Error formatting date', { date, formatStr, error });
    return fallback;
  }
}

/**
 * Safely calls getTime() on a date with fallback
 */
export function safeGetTimeWithFallback(date: unknown, fallback: number = 0): number {
  const dateObj = safeToDate(date);
  if (!dateObj) {
    return fallback;
  }

  try {
    return dateObj.getTime();
  } catch (error) {
    console.warn('safeGetTimeWithFallback: Error getting time', { date, error });
    return fallback;
  }
}

/**
 * Safely gets the time value from a date, with fallback
 */
export function safeGetTime(date: unknown, fallback: number = 0): number {
  if (!isValidDate(date)) {
    console.warn('safeGetTime: Invalid date provided', date);
    return fallback;
  }
  return date.getTime();
}

/**
 * Safely calculates the difference between two dates in milliseconds
 */
export function safeDateDiff(startDate: unknown, endDate: unknown, fallback: number = 0): number {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    console.warn('safeDateDiff: Invalid dates provided', { startDate, endDate });
    return fallback;
  }
  return endDate.getTime() - startDate.getTime();
}

/**
 * Safely compares two dates for sorting purposes
 */
export function safeDateCompare(dateA: unknown, dateB: unknown, sortDesc: boolean = true): number {
  const parsedDateA = safeToDate(dateA);
  const parsedDateB = safeToDate(dateB);

  if (!parsedDateA || !parsedDateB) {
    return 0;
  }

  const diff = parsedDateA.getTime() - parsedDateB.getTime();
  return sortDesc ? -diff : diff;
}

function formatDisplayDate(date: string | Date | null, options: DateFormatOptions) {
  const dateObj = safeToDate(date);
  if (!dateObj) return '-';

  try {
    return dateObj.toLocaleDateString('en-US', options);
  } catch {
    return '-';
  }
}

function isDateRangeLike(value: unknown): value is DateRangeLike {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
