import { isValid, parseISO } from 'date-fns';

// Default timezone for the application (Thailand).
// Server deployments can override it with APP_TIMEZONE.
const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Bangkok';

interface ZonedDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function parseDate(value: Date | string) {
  return typeof value === 'string' ? parseISO(value) : value;
}

function getZonedDateParts(date: Date, timezone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  ) as Partial<ZonedDateParts>;

  if (
    !values.year || !values.month || !values.day ||
    values.hour === undefined || values.minute === undefined || values.second === undefined
  ) {
    throw new RangeError(`Unable to format date in timezone ${timezone}`);
  }

  return values as ZonedDateParts;
}

/**
 * Returns the current instant for database storage.
 * Dates are stored as UTC instants; timezone is only a presentation concern.
 */
export function createDateInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  // Validate the configured IANA timezone early so a typo does not silently
  // produce environment-dependent display later.
  getZonedDateParts(new Date(), timezone);
  return new Date();
}

/**
 * Parses a stored UTC instant. A JavaScript Date does not itself carry an IANA
 * timezone; callers should use formatDateInTimezone for presentation.
 */
export function convertUtcToTimezone(
  utcDate: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  const date = parseDate(utcDate);
  if (!isValid(date)) return date;
  getZonedDateParts(date, timezone);
  return date;
}

/**
 * Formats an instant using the configured application timezone rather than the
 * operating system/browser timezone. The supported tokens cover the formats
 * used by Studio's table/date surfaces.
 */
export function formatDateInTimezone(
  date: Date | string,
  formatString: string = 'MMM d, yyyy HH:mm',
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const utcDate = parseDate(date);
  if (!isValid(utcDate)) return 'Invalid Date';

  const parts = getZonedDateParts(utcDate, timezone);
  const monthIndex = Number(parts.month) - 1;
  const replacements: Record<string, string> = {
    yyyy: parts.year,
    MMM: MONTH_ABBREVIATIONS[monthIndex] ?? parts.month,
    MM: parts.month,
    dd: parts.day,
    d: String(Number(parts.day)),
    HH: parts.hour,
    mm: parts.minute,
    ss: parts.second,
  };

  return formatString.replace(/yyyy|MMM|MM|dd|d|HH|mm|ss/g, token => replacements[token]);
}

/**
 * Gets the UTC offset for the supplied IANA timezone at the current instant.
 * Calculating from Intl parts accounts for daylight-saving zones as well as
 * fixed-offset zones such as Asia/Bangkok.
 */
export function getTimezoneOffset(timezone: string = DEFAULT_TIMEZONE): number {
  const now = new Date();
  const parts = getZonedDateParts(now, timezone);
  const zonedClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const instantWithoutMilliseconds = Math.floor(now.getTime() / 1000) * 1000;
  return (zonedClockAsUtc - instantWithoutMilliseconds) / 3_600_000;
}

export function getApplicationTimezone(): string {
  return DEFAULT_TIMEZONE;
}
