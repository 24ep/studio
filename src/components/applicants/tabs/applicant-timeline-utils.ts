import {
  APPLICANT_TIMELINE_MONTHS,
  getMonthYearLabel,
} from './applicant-timeline-label-utils';
import {
  formatDurationFromMonths,
  formatTimelineDuration,
  getTimelineEntryDurationMonths,
} from './applicant-timeline-duration-utils';
import { toFiniteTimelineNumber } from './applicant-timeline-number-utils';

export { APPLICANT_TIMELINE_MONTHS };
export { formatTimelineDuration };
export { toFiniteTimelineNumber };

export interface TimelineEntryLike {
  startMonth?: unknown;
  startYear?: unknown;
  endMonth?: unknown;
  endYear?: unknown;
  isCurrent?: unknown;
  fitScore?: unknown;
}

export function buildTimelineYearRange(currentYear = new Date().getFullYear()): string[] {
  return Array.from({ length: 50 }, (_, index) => (currentYear - index).toString());
}

export function getParsedTimelineEntries(parsedData: unknown, key: 'education' | 'experience'): unknown[] {
  if (!parsedData || typeof parsedData !== 'object' || !(key in parsedData)) {
    return [];
  }

  const entries = (parsedData as Record<string, unknown>)[key];
  return Array.isArray(entries) ? entries : [];
}

export function isCurrentTimelineEntry(entry: TimelineEntryLike): boolean {
  return entry.isCurrent === true || (!entry.endYear && !entry.endMonth);
}

export function getTimelineDisplay(
  entry: TimelineEntryLike,
  now = new Date(),
): { startLabel: string; endLabel: string | null; duration: string } | null {
  const startLabel = getMonthYearLabel(entry.startMonth, entry.startYear);
  if (!startLabel) {
    return null;
  }

  const current = isCurrentTimelineEntry(entry);
  return {
    startLabel,
    endLabel: current ? 'Present' : getMonthYearLabel(entry.endMonth, entry.endYear),
    duration: formatTimelineDuration(
      entry.startMonth,
      entry.startYear,
      entry.endMonth,
      entry.endYear,
      current,
      now,
    ),
  };
}

export function calculateTotalTimelineDuration(entries: unknown[], now = new Date()): string {
  if (!Array.isArray(entries)) {
    return '';
  }

  const totalMonths = entries.reduce<number>((total, entryValue) => {
    if (!entryValue || typeof entryValue !== 'object') {
      return total;
    }

    return total + getTimelineEntryDurationMonths(entryValue as TimelineEntryLike, now);
  }, 0);

  return formatDurationFromMonths(totalMonths);
}

export function hasTimelineFitScore(entry: TimelineEntryLike): boolean {
  return toFiniteTimelineNumber(entry.fitScore) !== null;
}
