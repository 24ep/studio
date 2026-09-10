import type { ExperienceEntry } from '@/lib/types';

export const SHORT_EXPERIENCE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTH_ALIASES = SHORT_EXPERIENCE_MONTHS.map(month => month.toLowerCase());
const MONTH_YEAR_PATTERN = /([A-Za-z]+)\s+(\d{4})/g;

export interface ExperiencePeriodContext {
  hasPresentPeriod: boolean;
  matches: Array<{ month: string; year: number }>;
}

export interface ExperienceDateRange {
  startDate: Date;
  endDate: Date;
}

export function getExperiencePeriodContext(period: string | undefined): ExperiencePeriodContext {
  return {
    hasPresentPeriod: period?.toLowerCase().includes('present') ?? false,
    matches: getMonthYearMatches(period),
  };
}

export function isCurrentExperienceWithPeriod(entry: ExperienceEntry, period: ExperiencePeriodContext) {
  return entry.is_current_position === true ||
    entry.isCurrent === true ||
    period.hasPresentPeriod ||
    (!hasStructuredEndDate(entry) && !hasCompletedLegacyPeriod(period));
}

export function getExperienceDateRange(entry: ExperienceEntry, now: Date): ExperienceDateRange | null {
  const period = getExperiencePeriodContext(entry.period);
  const startDate = getStartDate(entry, period);
  if (!startDate) return null;

  const endDate = getEndDate(entry, now, period);
  return endDate ? { startDate, endDate } : null;
}

export function getExperienceSortTime(entry: ExperienceEntry) {
  return getStartDate(entry)?.getTime() ?? 0;
}

export function formatMonthYearLabel(month: number | null, year: number | null) {
  if (month && year) return `${SHORT_EXPERIENCE_MONTHS[getMonthIndex(month)]} ${year}`;
  if (year) return String(year);
  return null;
}

export function formatMonthYearLabelFromPeriod(period: ExperiencePeriodContext, position: 'first' | 'last') {
  const date = getMonthYearDateFromPeriod(period, position);
  if (!date) return null;

  return `${SHORT_EXPERIENCE_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getStartDate(entry: ExperienceEntry, period = getExperiencePeriodContext(entry.period)) {
  if (entry.startYear) {
    return new Date(entry.startYear, getMonthIndex(entry.startMonth));
  }

  return getMonthYearDateFromPeriod(period, 'first');
}

function getEndDate(entry: ExperienceEntry, now: Date, period = getExperiencePeriodContext(entry.period)) {
  if (hasValidEndDate(entry, now)) {
    return new Date(entry.endYear, getMonthIndex(entry.endMonth));
  }

  if (isCurrentExperienceWithPeriod(entry, period)) {
    return now;
  }

  return getMonthYearDateFromPeriod(period, 'last');
}

function hasValidEndDate(entry: ExperienceEntry, now: Date): entry is ExperienceEntry & {
  endMonth: number;
  endYear: number;
} {
  return Boolean(
    entry.endYear &&
    entry.endMonth &&
    entry.endYear <= now.getFullYear() + 1 &&
    entry.endYear >= 1900
  );
}

function hasStructuredEndDate(entry: ExperienceEntry) {
  return Boolean(entry.endMonth && entry.endYear);
}

function hasCompletedLegacyPeriod(period: ExperiencePeriodContext) {
  return !period.hasPresentPeriod && period.matches.length > 1;
}

function getMonthYearDateFromPeriod(period: ExperiencePeriodContext, position: 'first' | 'last') {
  const match = position === 'first' ? period.matches[0] : period.matches.at(-1);
  if (!match) return null;

  const monthIndex = MONTH_ALIASES.indexOf(match.month.toLowerCase().slice(0, 3));
  return monthIndex === -1 ? null : new Date(match.year, monthIndex);
}

function getMonthYearMatches(period: string | undefined) {
  if (!period) return [];

  return Array.from(period.matchAll(MONTH_YEAR_PATTERN), match => ({
    month: match[1],
    year: Number(match[2]),
  })).filter(match => Number.isFinite(match.year));
}

function getMonthIndex(month: number | undefined) {
  return month && month >= 1 && month <= 12 ? month - 1 : 0;
}
