import { eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { safeDateDiff, safeGetDateFromRange } from '../../lib/utils/format';
import {
  createDefaultPeriodConfig,
  createLastNPeriodConfig,
  createPastNPeriodConfig,
  createSingleDayPeriodConfig,
  createThisPeriodConfig,
} from './new-applications-period-intervals';
import type {
  NewApplicationsPeriodConfig,
  NewApplicationsPeriodConfigInput,
} from './new-applications-period-types';

export function createDefaultNewApplicationsDateRange(now = new Date()): DateRange {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);
  return { from: startDate, to: now };
}

export function getCustomNewApplicationsRangeGranularity(dateRange?: DateRange) {
  const fromDate = safeGetDateFromRange(dateRange, 'from');
  const toDate = safeGetDateFromRange(dateRange, 'to');

  if (!fromDate || !toDate) return null;

  const daysDiff = Math.ceil(safeDateDiff(fromDate, toDate) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 30) return 'day';
  if (daysDiff <= 180) return 'week';
  return 'month';
}

export function getNewApplicationsPeriodConfig({
  periodType,
  periodUnit,
  periodN,
  dateRange,
  now = new Date(),
}: NewApplicationsPeriodConfigInput): NewApplicationsPeriodConfig {
  if (periodType === 'custom' && dateRange?.from && dateRange?.to) {
    const customConfig = getCustomPeriodConfig(dateRange);
    if (customConfig) {
      return customConfig;
    }
    console.warn('Invalid date range provided, falling back to default period');
  }

  if (periodType === 'today') {
    return createSingleDayPeriodConfig(now);
  }

  if (periodType === 'yesterday') {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - 1);
    return createSingleDayPeriodConfig(targetDate);
  }

  if (periodType === 'lastN') {
    return createLastNPeriodConfig(now, periodUnit, periodN);
  }

  if (periodType === 'this') {
    return createThisPeriodConfig(now, periodUnit);
  }

  if (periodType === 'pastN') {
    return createPastNPeriodConfig(now, periodUnit, periodN);
  }

  return createDefaultPeriodConfig(now);
}

function getCustomPeriodConfig(dateRange: DateRange): NewApplicationsPeriodConfig | null {
  const fromDate = safeGetDateFromRange(dateRange, 'from');
  const toDate = safeGetDateFromRange(dateRange, 'to');

  if (!fromDate || !toDate) return null;

  const granularity = getCustomNewApplicationsRangeGranularity(dateRange);
  if (granularity === 'day') {
    return {
      startDate: fromDate,
      endDate: toDate,
      intervalFunction: eachDayOfInterval,
      formatFunction: (date: Date) => format(date, 'MMM dd'),
    };
  }

  if (granularity === 'week') {
    return {
      startDate: fromDate,
      endDate: toDate,
      intervalFunction: eachWeekOfInterval,
      formatFunction: (date: Date) => `Week ${format(date, 'w')}`,
    };
  }

  return {
    startDate: fromDate,
    endDate: toDate,
    intervalFunction: eachMonthOfInterval,
    formatFunction: (date: Date) => format(date, 'MMM yyyy'),
  };
}
