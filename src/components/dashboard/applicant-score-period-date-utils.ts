import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type {
  ApplicantScorePeriodRange,
  ApplicantScorePeriodUnit,
} from "./applicant-score-distribution-types";

type PeriodDateBuilder = (now: Date, periodN: number) => Date;
type CurrentPeriodRangeBuilder = (now: Date) => ApplicantScorePeriodRange;

const PAST_PERIOD_START_BUILDERS: Record<ApplicantScorePeriodUnit, PeriodDateBuilder> = {
  day: (now, periodN) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - periodN),
  week: (now, periodN) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (periodN * 7)),
  month: (now, periodN) => new Date(now.getFullYear(), now.getMonth() - periodN, now.getDate()),
  year: (now, periodN) => new Date(now.getFullYear() - periodN, now.getMonth(), now.getDate()),
};

const EXCLUDED_CURRENT_PERIOD_END_BUILDERS: Record<ApplicantScorePeriodUnit, PeriodDateBuilder> = {
  day: (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999),
  week: (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999),
  month: (now) => new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 23, 59, 59, 999),
  year: (now) => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999),
};

const CURRENT_PERIOD_RANGE_BUILDERS: Record<ApplicantScorePeriodUnit, CurrentPeriodRangeBuilder> = {
  day: (now) => buildApplicantScoreDayRange(now),
  week: (now) => ({ startDate: startOfWeek(now), endDate: endOfWeek(now) }),
  month: (now) => ({ startDate: startOfMonth(now), endDate: endOfMonth(now) }),
  year: (now) => ({ startDate: startOfYear(now), endDate: endOfYear(now) }),
};

export function buildApplicantScoreDayRange(now: Date, dayOffset = 0): ApplicantScorePeriodRange {
  const date = now.getDate() + dayOffset;
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), date),
    endDate: new Date(now.getFullYear(), now.getMonth(), date, 23, 59, 59, 999),
  };
}

export function buildPastApplicantScorePeriodRange({
  excludeCurrentPeriod,
  now,
  periodN,
  periodUnit,
}: {
  excludeCurrentPeriod: boolean;
  now: Date;
  periodN: number;
  periodUnit: ApplicantScorePeriodUnit;
}): ApplicantScorePeriodRange {
  return {
    startDate: PAST_PERIOD_START_BUILDERS[periodUnit](now, periodN),
    endDate: excludeCurrentPeriod
      ? EXCLUDED_CURRENT_PERIOD_END_BUILDERS[periodUnit](now, periodN)
      : new Date(now),
  };
}

export function buildCurrentApplicantScorePeriodRange(
  periodUnit: ApplicantScorePeriodUnit,
  now: Date,
): ApplicantScorePeriodRange {
  return CURRENT_PERIOD_RANGE_BUILDERS[periodUnit](now);
}
