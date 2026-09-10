import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';

import {
  getCustomNewApplicationsRangeGranularity,
  type NewApplicationsPeriodType,
  type NewApplicationsPeriodUnit,
} from './new-applications-period-utils';

interface CurrentIntervalEndInput {
  intervalStart: Date;
  periodType: NewApplicationsPeriodType;
  periodUnit: NewApplicationsPeriodUnit;
  dateRange?: DateRange;
  endDate: Date;
}

export function getCurrentNewApplicationsIntervalEnd({
  intervalStart,
  periodType,
  periodUnit,
  dateRange,
  endDate,
}: CurrentIntervalEndInput) {
  const intervalEnd = resolveIntervalEnd({
    intervalStart,
    periodType,
    periodUnit,
    dateRange,
  });

  return intervalEnd > endDate ? new Date(endDate) : intervalEnd;
}

function resolveIntervalEnd({
  intervalStart,
  periodType,
  periodUnit,
  dateRange,
}: Omit<CurrentIntervalEndInput, 'endDate'>) {
  if (periodType === 'custom' && dateRange?.from && dateRange?.to) {
    return getCustomIntervalEnd(intervalStart, dateRange);
  }

  if (periodType === 'today' || periodType === 'yesterday') {
    return new Date(intervalStart.getTime() + 60 * 60 * 1000);
  }

  if (periodType === 'lastN') {
    return getLastNIntervalEnd(intervalStart, periodUnit);
  }

  if (periodType === 'this') {
    return periodUnit === 'year'
      ? endOfMonth(intervalStart)
      : addDays(intervalStart, 1);
  }

  return getDefaultIntervalEnd(intervalStart, periodUnit);
}

function getCustomIntervalEnd(intervalStart: Date, dateRange: DateRange) {
  const granularity = getCustomNewApplicationsRangeGranularity(dateRange);

  if (granularity === 'week') {
    return endOfWeek(intervalStart);
  }

  if (granularity === 'month') {
    return endOfMonth(intervalStart);
  }

  return addDays(intervalStart, 1);
}

function getLastNIntervalEnd(intervalStart: Date, periodUnit: NewApplicationsPeriodUnit) {
  if (periodUnit === 'week') {
    return endOfWeek(intervalStart);
  }

  if (periodUnit === 'month') {
    return endOfMonth(intervalStart);
  }

  if (periodUnit === 'year') {
    return endOfYear(intervalStart);
  }

  return addDays(intervalStart, 1);
}

function getDefaultIntervalEnd(intervalStart: Date, periodUnit: NewApplicationsPeriodUnit) {
  if (periodUnit === 'week') {
    return endOfWeek(intervalStart);
  }

  if (periodUnit === 'year') {
    return endOfYear(intervalStart);
  }

  return endOfMonth(intervalStart);
}
