import type { DateRange } from 'react-day-picker';

import type { Applicant } from '../../lib/types';
import { isValidDate } from '../../lib/utils/format';
import {
  buildInitialDataChartData,
  countApplicationsInRange,
  type InitialNewApplicationsDataPoint,
} from './new-applications-chart-data';
import { createNewApplicationsDataset } from './new-applications-chart-dataset';
import { getCurrentNewApplicationsIntervalEnd } from './new-applications-current-interval';
import {
  type NewApplicationsPeriodConfig,
  type NewApplicationsPeriodType,
  type NewApplicationsPeriodUnit,
} from './new-applications-period-utils';

export {
  PERIOD_TYPES,
  PERIOD_UNITS,
  createDefaultNewApplicationsDateRange,
  getNewApplicationsPeriodConfig,
} from './new-applications-period-utils';
export type {
  NewApplicationsPeriodConfig,
  NewApplicationsPeriodType,
  NewApplicationsPeriodUnit,
} from './new-applications-period-utils';

interface NewApplicationsChartDataInput {
  applicants: Applicant[];
  initialData?: InitialNewApplicationsDataPoint[];
  periodType: NewApplicationsPeriodType;
  periodUnit: NewApplicationsPeriodUnit;
  periodN: number;
  dateRange?: DateRange;
  periodConfig: NewApplicationsPeriodConfig;
}

export function buildNewApplicationsChartData({
  applicants,
  initialData,
  periodType,
  periodUnit,
  periodN,
  dateRange,
  periodConfig,
}: NewApplicationsChartDataInput) {
  const { startDate, endDate, intervalFunction, formatFunction } = periodConfig;
  const isCompatiblePeriod = (
    (periodType === 'lastN' || periodType === 'pastN' || periodType === 'this') &&
    periodUnit === 'day' &&
    periodN <= 30
  );

  if (initialData && isCompatiblePeriod) {
    return buildInitialDataChartData(initialData, startDate, endDate);
  }

  if (!applicants || applicants.length === 0) {
    return { labels: [], datasets: [] };
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    console.error('Invalid date range:', { startDate, endDate });
    return { labels: [], datasets: [] };
  }

  const intervals = intervalFunction({ start: startDate, end: endDate });
  if (!Array.isArray(intervals)) {
    console.error('intervalFunction did not return an array:', intervals);
    return { labels: [], datasets: [] };
  }

  const currentPeriodCounts = intervals.map(intervalStart => {
    if (!isValidDate(intervalStart)) {
      console.error('Invalid intervalStart:', intervalStart);
      return { label: 'Invalid Date', count: 0 };
    }

    const intervalEnd = getCurrentNewApplicationsIntervalEnd({
      intervalStart,
      periodType,
      periodUnit,
      dateRange,
      endDate,
    });

    return {
      label: formatFunction(intervalStart),
      count: countApplicationsInRange(applicants, intervalStart, intervalEnd),
    };
  });

  return {
    labels: currentPeriodCounts.map(item => item.label),
    datasets: [createNewApplicationsDataset(currentPeriodCounts.map(item => item.count))],
  };
}

export function countNewApplicationsInPeriod(applicants: Applicant[], startDate: Date, endDate: Date) {
  return countApplicationsInRange(applicants, startDate, endDate);
}

export function calculateAverageApplications(chartData: { labels: unknown[]; datasets: Array<{ data: number[] }> }) {
  if (chartData.labels.length === 0 || !chartData.datasets[0]) return 0;
  const total = chartData.datasets[0].data.reduce((sum, count) => sum + count, 0);
  return Math.round(total / chartData.labels.length);
}
