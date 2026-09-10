import type { Headcount } from '@/lib/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDeadlineDate(startDate: Date, days: number): Date {
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

export function getWholeDaysBetween(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
}

export function getRemainingDaysUntil(targetDate: Date, currentDate = new Date()): number {
  const diffMs = targetDate.getTime() - currentDate.getTime();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / MS_PER_DAY);
}

export function getEffectiveSLAStartDateForHeadcount(
  headcount: Pick<Headcount, 'status' | 'onboardingDate' | 'requestDate'>
): Date | null {
  if (headcount.status === 'filled' && headcount.onboardingDate) {
    return new Date(headcount.onboardingDate);
  }

  if (headcount.requestDate) {
    return new Date(headcount.requestDate);
  }

  return null;
}
