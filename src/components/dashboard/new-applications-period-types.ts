export type NewApplicationsPeriodType = 'today' | 'yesterday' | 'lastN' | 'this' | 'pastN' | 'custom';
export type NewApplicationsPeriodUnit = 'day' | 'week' | 'month' | 'year';

export type IntervalFunction = (range: { start: Date; end: Date }) => Date[];

export interface NewApplicationsPeriodConfig {
  startDate: Date;
  endDate: Date;
  intervalFunction: IntervalFunction;
  formatFunction: (date: Date) => string;
}

export interface NewApplicationsPeriodConfigInput {
  periodType: NewApplicationsPeriodType;
  periodUnit: NewApplicationsPeriodUnit;
  periodN: number;
  dateRange?: import('react-day-picker').DateRange;
  now?: Date;
}
