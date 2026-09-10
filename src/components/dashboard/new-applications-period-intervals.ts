import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

import type {
  IntervalFunction,
  NewApplicationsPeriodConfig,
  NewApplicationsPeriodUnit,
} from './new-applications-period-types';

export function createHourlyIntervals(start: Date) {
  const hours: Date[] = [];
  for (let i = 0; i < 24; i++) {
    hours.push(new Date(start.getFullYear(), start.getMonth(), start.getDate(), i, 0, 0, 0));
  }
  return hours;
}

export function createInclusiveDayInterval(today: Date): IntervalFunction {
  const todayForInterval = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return ({ start, end }) => {
    const days = eachDayOfInterval({ start, end });
    const todayIncluded = days.some(day =>
      day.getFullYear() === todayForInterval.getFullYear() &&
      day.getMonth() === todayForInterval.getMonth() &&
      day.getDate() === todayForInterval.getDate()
    );

    if (!todayIncluded && todayForInterval >= start && todayForInterval <= end) {
      days.push(todayForInterval);
      days.sort((a, b) => a.getTime() - b.getTime());
    }

    return days;
  };
}

export function createSingleDayPeriodConfig(targetDate: Date): NewApplicationsPeriodConfig {
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  return {
    startDate: start,
    endDate: end,
    intervalFunction: () => createHourlyIntervals(start),
    formatFunction: (date: Date) => format(date, 'HH:mm'),
  };
}

export function createLastNPeriodConfig(now: Date, periodUnit: NewApplicationsPeriodUnit, periodN: number) {
  let start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (periodUnit === 'day') {
    start.setDate(start.getDate() - periodN);
    start.setHours(0, 0, 0, 0);
    return config(start, end, createInclusiveDayInterval(now), (date: Date) => format(date, 'MMM dd'));
  }

  if (periodUnit === 'week') {
    start = subWeeks(now, periodN);
    start.setHours(0, 0, 0, 0);
    return config(start, end, eachWeekOfInterval, (date: Date) => `Week ${format(date, 'w')}`);
  }

  if (periodUnit === 'month') {
    start = subMonths(now, periodN);
    start.setHours(0, 0, 0, 0);
    return config(start, end, eachMonthOfInterval, (date: Date) => format(date, 'MMM yyyy'));
  }

  start = subYears(now, periodN);
  start.setHours(0, 0, 0, 0);
  return config(start, end, eachYearOfInterval, (date: Date) => format(date, 'yyyy'));
}

export function createThisPeriodConfig(now: Date, periodUnit: NewApplicationsPeriodUnit) {
  if (periodUnit === 'day') {
    return createSingleDayPeriodConfig(now);
  }

  if (periodUnit === 'week') {
    return config(startOfWeek(now), endOfWeek(now), eachDayOfInterval, (date: Date) => format(date, 'EEE dd'));
  }

  if (periodUnit === 'month') {
    return config(startOfMonth(now), endOfMonth(now), eachWeekOfInterval, (date: Date) => `Week ${format(date, 'w')}`);
  }

  return config(startOfYear(now), endOfYear(now), eachMonthOfInterval, (date: Date) => format(date, 'MMM'));
}

export function createPastNPeriodConfig(now: Date, periodUnit: NewApplicationsPeriodUnit, periodN: number) {
  if (periodUnit === 'day') {
    const start = new Date(now);
    start.setDate(start.getDate() - periodN);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return config(start, end, createInclusiveDayInterval(now), (date: Date) => format(date, 'MMM dd'));
  }

  if (periodUnit === 'week') {
    return config(subWeeks(now, periodN), now, eachWeekOfInterval, (date: Date) => `Week ${format(date, 'w')}`);
  }

  if (periodUnit === 'month') {
    return config(subMonths(now, periodN), now, eachMonthOfInterval, (date: Date) => format(date, 'MMM yyyy'));
  }

  return config(subYears(now, periodN), now, eachYearOfInterval, (date: Date) => format(date, 'yyyy'));
}

export function createDefaultPeriodConfig(now: Date): NewApplicationsPeriodConfig {
  return config(now, now, eachWeekOfInterval, (date: Date) => format(date, 'MMM dd'));
}

function config(
  startDate: Date,
  endDate: Date,
  intervalFunction: IntervalFunction,
  formatFunction: (date: Date) => string,
): NewApplicationsPeriodConfig {
  return { startDate, endDate, intervalFunction, formatFunction };
}
