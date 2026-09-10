import type { NewApplicationsPeriodType, NewApplicationsPeriodUnit } from './new-applications-period-types';

export const PERIOD_TYPES: Array<{ label: string; value: NewApplicationsPeriodType }> = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last', value: 'lastN' },
  { label: 'This', value: 'this' },
  { label: 'Past', value: 'pastN' },
  { label: 'Custom', value: 'custom' },
];

export const PERIOD_UNITS: Array<{ label: string; value: NewApplicationsPeriodUnit }> = [
  { label: 'Day(s)', value: 'day' },
  { label: 'Week(s)', value: 'week' },
  { label: 'Month(s)', value: 'month' },
  { label: 'Year(s)', value: 'year' },
];
