import type { TimelineEntryLike } from './applicant-timeline-utils';
import { getTimelineDate } from './applicant-timeline-label-utils';
import { getTimelineYear } from './applicant-timeline-number-utils';

function pluralize(value: number, unit: 'year' | 'month'): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

export function formatDurationFromMonths(totalMonths: number): string {
  if (!Number.isFinite(totalMonths) || totalMonths <= 0) {
    return '';
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];

  if (years > 0) {
    parts.push(pluralize(years, 'year'));
  }
  if (months > 0) {
    parts.push(pluralize(months, 'month'));
  }

  return parts.join(' ');
}

function getMonthDifference(startDate: Date, endDate: Date) {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
}

export function getTimelineEntryDurationMonths(
  entry: TimelineEntryLike,
  now: Date
) {
  const startDate = getTimelineDate(entry.startMonth, entry.startYear);
  if (!startDate) {
    return 0;
  }

  const currentYear = now.getFullYear();
  const endYear = getTimelineYear(entry.endYear);
  const endDate = getValidTimelineEndDate(entry, endYear, currentYear) ?? now;
  const months = getMonthDifference(startDate, endDate);

  return months > 0 ? months : 0;
}

function getValidTimelineEndDate(
  entry: TimelineEntryLike,
  endYear: number | null,
  currentYear: number
) {
  if (endYear === null || endYear > currentYear + 1 || endYear < 1900) {
    return null;
  }

  return getTimelineDate(entry.endMonth, entry.endYear);
}

export function formatTimelineDuration(
  startMonth: unknown,
  startYear: unknown,
  endMonth: unknown,
  endYear: unknown,
  isCurrent: boolean,
  now = new Date(),
): string {
  const startDate = getTimelineDate(startMonth, startYear);
  if (!startDate) {
    return '';
  }

  const endDate = isCurrent ? now : getTimelineDate(endMonth, endYear);
  if (!endDate) {
    return '';
  }

  return formatDurationFromMonths(getMonthDifference(startDate, endDate));
}
