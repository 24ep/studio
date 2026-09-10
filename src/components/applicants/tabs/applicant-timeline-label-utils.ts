import {
  getTimelineMonthIndex,
  getTimelineYear,
} from './applicant-timeline-number-utils';

export const APPLICANT_TIMELINE_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getTimelineDate(month: unknown, year: unknown): Date | null {
  const parsedYear = getTimelineYear(year);
  if (parsedYear === null) {
    return null;
  }

  return new Date(parsedYear, getTimelineMonthIndex(month));
}

export function getMonthYearLabel(month: unknown, year: unknown): string | null {
  const parsedYear = getTimelineYear(year);
  if (parsedYear === null) {
    return null;
  }

  return `${APPLICANT_TIMELINE_MONTHS[getTimelineMonthIndex(month)]} ${parsedYear}`;
}
