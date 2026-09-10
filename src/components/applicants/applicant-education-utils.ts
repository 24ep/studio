import { differenceInMonths } from 'date-fns';

import type { EducationEntry } from '@/lib/types';

const EDUCATION_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_PATTERN = /(\d{4})/;

export interface EducationTimelineLabels {
  startLabel: string | null;
  endLabel: string | null;
}

export function isCurrentEducation(entry: EducationEntry) {
  return !entry.endYear && !entry.endMonth;
}

export function getEducationFieldLabel(entry: EducationEntry) {
  if (entry.major && entry.field) {
    return `${entry.major} - ${entry.field}`;
  }

  return entry.major || entry.field || 'Field of study not specified';
}

export function getEducationInstitutionLabel(entry: EducationEntry) {
  const university = entry.university || 'University not specified';
  return entry.campus ? `${university} (${entry.campus})` : university;
}

export function sortEducationByTimeline(education: EducationEntry[]) {
  return [...education].sort((first, second) => getPeriodYear(second.period) - getPeriodYear(first.period));
}

export function getEducationTimelineLabels(entry: EducationEntry): EducationTimelineLabels {
  return {
    startLabel: formatMonthYearLabel(entry.startMonth ?? null, entry.startYear ?? null),
    endLabel: isCurrentEducation(entry)
      ? 'Present'
      : formatMonthYearLabel(entry.endMonth ?? null, entry.endYear ?? null),
  };
}

export function formatEducationTimelineDuration(entry: EducationEntry, now = new Date()) {
  if (!entry.startYear) return '';

  const start = new Date(entry.startYear, getMonthIndex(entry.startMonth));
  const end = getEducationEndDate(entry, now);
  const months = differenceInMonths(end, start);

  return formatEducationDurationMonths(months);
}

function getEducationEndDate(entry: EducationEntry, now: Date) {
  if (isCurrentEducation(entry) || !entry.endYear) {
    return now;
  }

  return new Date(entry.endYear, getMonthIndex(entry.endMonth));
}

function formatEducationDurationMonths(months: number) {
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const parts = [
    formatDurationPart(years, 'Year'),
    formatDurationPart(remMonths, 'Month'),
  ].filter(Boolean);

  return parts.length ? `(${parts.join(', ')})` : '';
}

function formatDurationPart(value: number, unit: 'Year' | 'Month') {
  if (value <= 0) return null;

  return `${value} ${unit}${value > 1 ? 's' : ''}`;
}

function formatMonthYearLabel(month: number | null, year: number | null) {
  if (month && year) {
    return `${EDUCATION_MONTHS[getMonthIndex(month)] || month} ${year}`;
  }

  return year ? String(year) : null;
}

function getMonthIndex(month: number | null | undefined) {
  return month && month >= 1 && month <= 12 ? month - 1 : 0;
}

function getPeriodYear(period?: string | null) {
  const yearMatch = period?.match(YEAR_PATTERN);
  return yearMatch ? Number(yearMatch[1]) : 0;
}
