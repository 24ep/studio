import { differenceInMonths } from 'date-fns';

import type { ExperienceEntry } from '@/lib/types';
import { getExperienceDateRange } from './applicant-experience-period-utils';

export function getExperienceDurationMonths(entry: ExperienceEntry, now: Date) {
  const range = getExperienceDateRange(entry, now);
  if (!range) return 0;

  const months = differenceInMonths(range.endDate, range.startDate);
  return months > 0 ? months : 0;
}

export function formatMonthDuration(totalMonths: number) {
  if (!Number.isFinite(totalMonths) || totalMonths <= 0) return '';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return [
    formatDurationPart(years, 'year'),
    formatDurationPart(months, 'month'),
  ].filter(Boolean).join(' ');
}

function formatDurationPart(value: number, unit: 'year' | 'month') {
  if (value <= 0) return null;

  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}
